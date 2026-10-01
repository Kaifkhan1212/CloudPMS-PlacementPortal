'use strict';

const EmailLog = require('../models/EmailLog.model');
const Application = require('../models/Application.model');
const Drive = require('../models/Drive.model');
const User = require('../models/User.model');
const StudentProfile = require('../models/StudentProfile.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { sendEmail } = require('../utils/awsServices');

/**
 * POST /api/placement-cell/emails/send
 */
const sendManualEmail = async (req, res, next) => {
  try {
    const { recipientMode, recipients, driveId, subject, message } = req.body;
    let targetEmails = [];
    let relatedApplicationIds = [];

    if (recipientMode === 'single' || recipientMode === 'multiple') {
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new ApiError(400, 'Recipients array is required for this mode');
      }
      targetEmails = recipients;
    } else {
      if (!driveId) {
        throw new ApiError(400, 'driveId is required for this recipient mode');
      }

      let filter = { drive: driveId };
      if (recipientMode === 'shortlisted') filter.status = 'Shortlisted';
      if (recipientMode === 'interview_scheduled') filter.status = 'Interview Scheduled';
      if (recipientMode === 'selected') filter.status = 'Selected';

      const applications = await Application.find(filter).populate({
        path: 'student',
        populate: { path: 'user' }
      });

      targetEmails = applications
        .filter(app => app.student && app.student.user && app.student.user.email)
        .map(app => app.student.user.email);
        
      relatedApplicationIds = applications.map(app => app._id);
    }

    if (targetEmails.length === 0) {
      throw new ApiError(400, 'No recipients found to send emails to.');
    }

    // Send emails in parallel but limit concurrency if needed. For now Promise.all.
    // In production, a queue (e.g., BullMQ) is recommended, but we stick to the existing architecture.
    const emailPromises = targetEmails.map(email => {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; white-space: pre-wrap;">
          ${message}
        </div>
      `;
      return sendEmail(email, subject, htmlBody, {
        type: 'manual',
        relatedDriveId: driveId || null,
        relatedApplicationIds: relatedApplicationIds,
        sentBy: req.user.userId
      });
    });

    await Promise.all(emailPromises);

    return res.status(200).json(
      new ApiResponse(200, null, `Email sent successfully to ${targetEmails.length} recipient(s).`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/placement-cell/emails
 */
const getEmailLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, type, status } = req.query;
    
    let filter = {};
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { recipients: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await EmailLog.find(filter)
      .populate('sentBy', 'name email')
      .populate('relatedDriveId', 'company jobRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmailLog.countDocuments(filter);

    return res.status(200).json(
      new ApiResponse(200, {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        }
      }, 'Email logs fetched')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/placement-cell/emails/:id
 */
const getEmailLogDetails = async (req, res, next) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate('sentBy', 'name email')
      .populate('relatedDriveId', 'company jobRole')
      .populate({
        path: 'relatedApplicationIds',
        populate: {
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        }
      });

    if (!log) {
      throw new ApiError(404, 'Email log not found');
    }

    return res.status(200).json(
      new ApiResponse(200, { log }, 'Email log details fetched')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendManualEmail,
  getEmailLogs,
  getEmailLogDetails
};
