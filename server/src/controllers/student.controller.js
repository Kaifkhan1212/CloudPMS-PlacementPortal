/**
 * controllers/student.controller.js — Student Module
 *
 * Endpoints:
 *  POST   /api/students/profile          → Create/update student profile
 *  GET    /api/students/profile          → Get own profile
 *  POST   /api/students/resume           → Upload resume to AWS S3
 *  GET    /api/students/drives           → List eligible drives (auto-filtered)
 *  POST   /api/students/drives/:driveId/apply → Apply to a drive
 *  GET    /api/students/applications     → View own application history
 */

'use strict';

const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/awsClients');
const StudentProfile = require('../models/StudentProfile.model');
const Drive = require('../models/Drive.model');
const Application = require('../models/Application.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { parseResumeSkills, sendEmail } = require('../utils/awsServices');

// ── Helper: Build S3 public URL ────────────────────────────────
const buildS3Url = (key) =>
  `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

// ─────────────────────────────────────────────────────────────
// POST /api/students/profile  (create or update — upsert)
// Access: student only
// ─────────────────────────────────────────────────────────────
const upsertProfile = async (req, res, next) => {
  try {
    const { rollNumber, branch, cgpa, backlogCount, skills, tenthPercent, twelfthPercent } = req.body;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.userId },
      {
        user: req.user.userId,
        rollNumber,
        branch,
        cgpa,
        backlogCount: backlogCount ?? 0,
        ...(skills && { skills }),
        ...(tenthPercent !== undefined && { tenthPercent }),
        ...(twelfthPercent !== undefined && { twelfthPercent }),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(
      new ApiResponse(200, { profile }, 'Profile saved successfully')
    );
  } catch (error) {
    // Duplicate rollNumber from another user
    if (error.code === 11000) {
      return next(new ApiError(409, 'Roll number already registered to another account'));
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students/profile
// Access: student only
// ─────────────────────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.userId }).populate(
      'user',
      'name email createdAt'
    );

    if (!profile) {
      throw new ApiError(404, 'Profile not found — please create your profile first');
    }

    return res.status(200).json(new ApiResponse(200, { profile }, 'Profile fetched'));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/resume
// Access: student only
// Body: multipart/form-data — field name: "resume"
//
// Cloud flow (for viva):
//   Browser → Express (Multer memoryStorage) → AWS S3 PutObject
//   File never touches the server's disk — streamed from RAM to S3.
//   S3 key format: resumes/<userId>/<timestamp>-<originalname>
// ─────────────────────────────────────────────────────────────
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded — attach a PDF under the field name "resume"');
    }

    const profile = await StudentProfile.findOne({ user: req.user.userId });
    if (!profile) {
      throw new ApiError(404, 'Create your student profile before uploading a resume');
    }

    // Delete old resume from S3 if it exists
    if (profile.resumePath) {
      try {
        // Extract S3 key from stored URL
        const url = new URL(profile.resumePath);
        const oldKey = url.pathname.slice(1); // remove leading "/"
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: oldKey,
          })
        );
      } catch {
        // Non-fatal — log and continue
        console.warn('Could not delete old S3 resume — continuing with new upload');
      }
    }

    // Build a unique S3 object key
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `resumes/${req.user.userId}/${Date.now()}-${sanitizedName}`;

    // Upload buffer directly to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
        // Tag for lifecycle management / cost attribution
        Tagging: `role=student&userId=${req.user.userId}`,
      })
    );

    const resumeUrl = buildS3Url(s3Key);

    // Persist S3 URL and Textract skills in student profile
    profile.resumePath = resumeUrl;
    
    // AWS Textract: extract skills
    const extractedSkills = await parseResumeSkills(s3Key);
    profile.skills = extractedSkills;

    await profile.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(200, { resumeUrl, skills: extractedSkills }, 'Resume uploaded and parsed successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students/drives
// Access: student only
// Returns drives the student is ELIGIBLE for, not yet applied to (optional ?applied=true)
//
// Eligibility filter (all three must pass):
//   1. Drive's allowedBranches includes student's branch
//   2. Drive's minCgpa <= student's cgpa
//   3. Drive's maxBacklogs >= student's backlogCount
//   4. Drive deadline is in the future
//   5. Drive status != 'Completed'
// ─────────────────────────────────────────────────────────────
const getEligibleDrives = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.userId });
    if (!profile) {
      throw new ApiError(404, 'Complete your student profile to view eligible drives');
    }

    // Optional: filter drives student has already applied to
    const { applied } = req.query; // ?applied=true → show applied drives
    let appliedDriveIds = [];
    if (!applied || applied === 'false') {
      const myApplications = await Application.find({ student: profile._id }).select('drive');
      appliedDriveIds = myApplications.map((a) => a.drive);
    }

    const drives = await Drive.find({
      status: { $ne: 'Completed' },
      deadline: { $gt: new Date() },
      'eligibility.minCgpa': { $lte: profile.cgpa },
      'eligibility.maxBacklogs': { $gte: profile.backlogCount },
      'eligibility.allowedBranches': profile.branch,
      ...(appliedDriveIds.length > 0 && { _id: { $nin: appliedDriveIds } }),
    })
      .populate('postedBy', 'name email')
      .sort({ deadline: 1 }); // Soonest deadline first

    return res.status(200).json(
      new ApiResponse(200, { count: drives.length, drives }, 'Eligible drives fetched')
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/drives/:driveId/apply
// Access: student only
//
// Guards:
//  - Student profile must exist
//  - Drive must be open (status != Completed, deadline not passed)
//  - Student must meet eligibility criteria
//  - No duplicate application (compound index at DB level + pre-check here)
// ─────────────────────────────────────────────────────────────
const applyToDrive = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    const [profile, drive] = await Promise.all([
      StudentProfile.findOne({ user: req.user.userId }),
      Drive.findById(driveId),
    ]);

    if (!profile) throw new ApiError(404, 'Complete your profile before applying');
    if (!drive) throw new ApiError(404, 'Drive not found');

    // Drive availability check
    if (drive.status === 'Completed') {
      throw new ApiError(400, 'This drive has already been completed');
    }
    if (new Date() > drive.deadline) {
      throw new ApiError(400, 'Application deadline has passed');
    }

    // Eligibility check
    const eligible =
      drive.eligibility.allowedBranches.includes(profile.branch) &&
      profile.cgpa >= drive.eligibility.minCgpa &&
      profile.backlogCount <= drive.eligibility.maxBacklogs;

    if (!eligible) {
      throw new ApiError(403, 'You do not meet the eligibility criteria for this drive');
    }

    // Create application (compound index prevents duplicate at DB level)
    const application = await Application.create({
      student: profile._id,
      drive: driveId,
    });

    // Send confirmation email
    const user = await require('../models/User.model').findById(req.user.userId);
    if (user) {
      const emailSubject = `Application Confirmation: ${drive.company} - ${drive.jobRole}`;
      const emailBody = `
        <h3>Application Successful</h3>
        <p>Dear ${user.name},</p>
        <p>You have successfully applied for the <strong>${drive.jobRole}</strong> role at <strong>${drive.company}</strong>.</p>
        <p>We will notify you when there is an update on your application status.</p>
        <p>Regards,<br/>CloudPMS Placement Cell</p>
      `;
      await sendEmail(user.email, emailSubject, emailBody, { type: 'application_confirmation', relatedDriveId: driveId, relatedApplicationIds: [application._id], sentBy: req.user.userId });
    }

    return res.status(201).json(
      new ApiResponse(201, { application }, 'Application submitted successfully')
    );
  } catch (error) {
    // Compound unique index violation
    if (error.code === 11000) {
      return next(new ApiError(409, 'You have already applied to this drive'));
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students/applications
// Access: student only
// ─────────────────────────────────────────────────────────────
const getMyApplications = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.userId });
    if (!profile) throw new ApiError(404, 'Student profile not found');

    const applications = await Application.find({ student: profile._id })
      .populate({
        path: 'drive',
        select: 'company jobRole ctc deadline driveDate venue status',
        populate: { path: 'postedBy', select: 'name' },
      })
      .sort({ appliedAt: -1 }); // Most recent first

    return res.status(200).json(
      new ApiResponse(200, { count: applications.length, applications }, 'Applications fetched')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertProfile,
  getMyProfile,
  uploadResume,
  getEligibleDrives,
  applyToDrive,
  getMyApplications,
};
