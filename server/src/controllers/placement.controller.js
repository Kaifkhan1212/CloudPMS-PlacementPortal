/**
 * controllers/placement.controller.js — Placement Cell Module
 *
 * Endpoints:
 *  POST   /api/placement/drives               → Create drive
 *  GET    /api/placement/drives               → List own drives
 *  PUT    /api/placement/drives/:id           → Edit drive details
 *  PATCH  /api/placement/drives/:id/close     → Close/complete a drive
 *  GET    /api/placement/drives/:id/applicants → View all applicants for a drive
 *  PATCH  /api/placement/applications/:appId/status → Update applicant status
 */

'use strict';

const Drive = require('../models/Drive.model');
const Application = require('../models/Application.model');
const StudentProfile = require('../models/StudentProfile.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { sendEmail } = require('../utils/awsServices');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/awsClients');

// ─────────────────────────────────────────────────────────────
// POST /api/placement/drives
// Access: placement_cell, admin
// ─────────────────────────────────────────────────────────────
const createDrive = async (req, res, next) => {
  try {
    const {
      company, jobRole, ctc, description,
      eligibility, deadline, driveDate, venue,
    } = req.body;

    const drive = await Drive.create({
      company,
      jobRole,
      ctc,
      description,
      eligibility,
      deadline,
      driveDate,
      venue,
      postedBy: req.user.userId,
    });

    return res.status(201).json(
      new ApiResponse(201, { drive }, 'Drive created successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/placement/drives
// Access: placement_cell, admin
// Placement cell sees only drives they posted; admin sees all.
// ─────────────────────────────────────────────────────────────
const getMyDrives = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { postedBy: req.user.userId };

    const drives = await Drive.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    // Attach applicant count to each drive for quick overview
    const drivesWithCounts = await Promise.all(
      drives.map(async (drive) => {
        const applicantCount = await Application.countDocuments({ drive: drive._id });
        return { ...drive.toObject(), applicantCount };
      })
    );

    return res.status(200).json(
      new ApiResponse(200, { count: drives.length, drives: drivesWithCounts }, 'Drives fetched')
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/placement/drives/:id
// Access: placement_cell (own drives only), admin
// ─────────────────────────────────────────────────────────────
const updateDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) throw new ApiError(404, 'Drive not found');

    // Placement cell can only edit their own drives
    if (
      req.user.role === 'placement_cell' &&
      drive.postedBy.toString() !== req.user.userId
    ) {
      throw new ApiError(403, 'You can only edit drives you created');
    }

    if (drive.status === 'Completed') {
      throw new ApiError(400, 'Cannot edit a completed drive');
    }

    const allowedFields = [
      'company', 'jobRole', 'ctc', 'description',
      'eligibility', 'deadline', 'driveDate', 'venue', 'status',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) drive[field] = req.body[field];
    });

    await drive.save();

    return res.status(200).json(new ApiResponse(200, { drive }, 'Drive updated successfully'));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/placement/drives/:id/close
// Access: placement_cell (own), admin
// Sets status → 'Completed'. Cannot be undone via API.
// ─────────────────────────────────────────────────────────────
const closeDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) throw new ApiError(404, 'Drive not found');

    if (
      req.user.role === 'placement_cell' &&
      drive.postedBy.toString() !== req.user.userId
    ) {
      throw new ApiError(403, 'You can only close drives you created');
    }

    if (drive.status === 'Completed') {
      throw new ApiError(400, 'Drive is already closed');
    }

    drive.status = 'Completed';
    await drive.save();

    return res.status(200).json(new ApiResponse(200, { drive }, 'Drive closed successfully'));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/placement/drives/:id/applicants
// Access: placement_cell, admin
// Returns all applications for a drive, grouped with student details.
// ─────────────────────────────────────────────────────────────
const getDriveApplicants = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) throw new ApiError(404, 'Drive not found');

    if (
      req.user.role === 'placement_cell' &&
      drive.postedBy.toString() !== req.user.userId
    ) {
      throw new ApiError(403, 'Access denied — not your drive');
    }

    // Optional: filter by status ?status=Shortlisted
    const statusFilter = req.query.status
      ? { drive: drive._id, status: req.query.status }
      : { drive: drive._id };

    const applications = await Application.find(statusFilter)
      .populate({
        path: 'student',
        select: 'rollNumber branch cgpa backlogCount resumePath skills',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ appliedAt: 1 }); // Oldest application first

    return res.status(200).json(
      new ApiResponse(
        200,
        { drive: { id: drive._id, company: drive.company, jobRole: drive.jobRole },
          count: applications.length,
          applications },
        'Applicants fetched'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/placement/applications/:appId/status
// Access: placement_cell, admin
//
// Body: { status, remarks, interviewDate }
//
// Status flow:
//   Applied → Shortlisted → Interview Scheduled → Selected | Rejected
//
// When a student is Selected, their StudentProfile.isPlaced is set to true.
// ─────────────────────────────────────────────────────────────
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks, interviewDate } = req.body;
    const { APPLICATION_STATUSES } = require('../models/Application.model');

    if (!APPLICATION_STATUSES.includes(status)) {
      throw new ApiError(422, `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(', ')}`);
    }

    const application = await Application.findById(req.params.appId).populate('drive').populate({ path: 'student', populate: { path: 'user' } });
    if (!application) throw new ApiError(404, 'Application not found');

    // Placement cell can only update applications for their own drives
    if (
      req.user.role === 'placement_cell' &&
      application.drive.postedBy.toString() !== req.user.userId
    ) {
      throw new ApiError(403, 'Access denied — not your drive');
    }

    application.status = status;
    if (remarks !== undefined) application.remarks = remarks;

    // If status is 'Interview Scheduled', optionally store interview date in remarks
    if (status === 'Interview Scheduled' && interviewDate) {
      application.remarks = `Interview Date: ${interviewDate}${remarks ? ' | ' + remarks : ''}`;
    }

    await application.save();

    // If selected, mark student as placed
    if (status === 'Selected') {
      await StudentProfile.findByIdAndUpdate(application.student, { isPlaced: true });
    }

    // If previously selected but now rejected, consider clearing isPlaced
    // (only if no other Selected application exists for this student)
    if (status === 'Rejected') {
      const otherSelected = await Application.findOne({
        student: application.student,
        status: 'Selected',
        _id: { $ne: application._id },
      });
      if (!otherSelected) {
        await StudentProfile.findByIdAndUpdate(application.student, { isPlaced: false });
      }
    }

    // Send email notification to student
    if (application.student && application.student.user && application.student.user.email) {
      const emailSubject = `Application Update: ${status} - ${application.drive.company}`;
      let statusMessage = `Your application status for the <strong>${application.drive.jobRole}</strong> role at <strong>${application.drive.company}</strong> has been updated to <strong>${status}</strong>.`;
      
      if (remarks) {
        statusMessage += `<br/><br/><strong>Remarks:</strong> ${remarks}`;
      }
      if (status === 'Interview Scheduled' && interviewDate) {
        statusMessage += `<br/><br/><strong>Interview Date:</strong> ${interviewDate}`;
      }

      const emailBody = `
        <h3>Application Status Update</h3>
        <p>Dear ${application.student.user.name},</p>
        <p>${statusMessage}</p>
        <p>Regards,<br/>CloudPMS Placement Cell</p>
      `;
      await sendEmail(application.student.user.email, emailSubject, emailBody, { type: 'status_update', relatedDriveId: application.drive._id, relatedApplicationIds: [application._id], sentBy: req.user.userId });
    }

    return res.status(200).json(
      new ApiResponse(200, { application }, 'Application status updated')
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/placement/students/:studentId/resume-view
// Access: placement_cell, admin
// ─────────────────────────────────────────────────────────────
const getStudentResumeView = async (req, res, next) => {
  try {
    const student = await StudentProfile.findById(req.params.studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    if (!student.resumePath) throw new ApiError(404, 'Student has no resume uploaded');

    const url = new URL(student.resumePath);
    const key = url.pathname.slice(1);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return res.status(200).json(
      new ApiResponse(200, { url: presignedUrl }, 'Resume view URL generated')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrive,
  getMyDrives,
  updateDrive,
  closeDrive,
  getDriveApplicants,
  updateApplicationStatus,
  getStudentResumeView,
};
