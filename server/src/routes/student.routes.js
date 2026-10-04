/**
 * routes/student.routes.js — Student Module Routes
 *
 * All routes require: verifyToken + allowRoles('student')
 *
 * Profile:
 *   POST/GET /profile          → Create or get own profile
 *   POST     /resume           → Upload resume to S3 (multipart/form-data)
 *
 * Drives:
 *   GET      /drives           → Auto-filtered eligible drives
 *   POST     /drives/:id/apply → Apply to a drive
 *
 * Applications:
 *   GET      /applications     → My application status history
 */

'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const studentController = require('../controllers/student.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');
const { BRANCHES } = require('../models/StudentProfile.model');

// Apply auth + role guard to all routes in this file
router.use(verifyToken, allowRoles('student'));

// ── Profile ───────────────────────────────────────────────────
const profileValidation = [
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('branch')
    .notEmpty().withMessage('Branch is required')
    .isIn(BRANCHES).withMessage(`Branch must be one of: ${BRANCHES.join(', ')}`),
  body('cgpa')
    .notEmpty().withMessage('CGPA is required')
    .isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('backlogCount')
    .optional()
    .isInt({ min: 0 }).withMessage('Backlog count must be a non-negative integer'),
  body('tenthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('10th percentage must be between 0 and 100'),
  body('twelfthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('12th percentage must be between 0 and 100'),
];

router.post('/profile', profileValidation, validate, studentController.upsertProfile);
router.put('/profile', profileValidation, validate, studentController.upsertProfile);
router.get('/profile', studentController.getMyProfile);

// ── Resume Upload ─────────────────────────────────────────────
// upload.single('resume') → expects field name "resume" in multipart form
router.post(
  '/resume',
  upload.single('resume'),
  studentController.uploadResume
);

// ── Drives ────────────────────────────────────────────────────
router.get('/drives', studentController.getEligibleDrives);

router.post(
  '/drives/:driveId/apply',
  [param('driveId').isMongoId().withMessage('Invalid drive ID')],
  validate,
  studentController.applyToDrive
);

// ── Applications ──────────────────────────────────────────────
router.get('/applications', studentController.getMyApplications);

router.get('/resume-view', studentController.getMyResumeView);

module.exports = router;
