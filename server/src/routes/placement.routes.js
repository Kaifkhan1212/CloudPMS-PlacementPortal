/**
 * routes/placement.routes.js — Placement Cell Module Routes
 *
 * Access: placement_cell + admin (unless noted)
 *
 * Drives:
 *   POST   /drives              → Create drive
 *   GET    /drives              → List own drives (admin sees all)
 *   PUT    /drives/:id          → Edit drive
 *   PATCH  /drives/:id/close    → Close drive
 *   GET    /drives/:id/applicants → View applicants (?status=Shortlisted)
 *
 * Applications:
 *   PATCH  /applications/:appId/status → Update applicant status
 */

'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const placementController = require('../controllers/placement.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { BRANCHES } = require('../models/StudentProfile.model');
const { APPLICATION_STATUSES } = require('../models/Application.model');
const { DRIVE_STATUSES } = require('../models/Drive.model');

router.use(verifyToken, allowRoles('placement_cell', 'admin'));

// ── Drive validation chain ────────────────────────────────────
const driveValidation = [
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('jobRole').trim().notEmpty().withMessage('Job role is required'),
  body('ctc').isFloat({ min: 0 }).withMessage('CTC must be a non-negative number'),
  body('eligibility.minCgpa')
    .isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
  body('eligibility.allowedBranches')
    .isArray({ min: 1 }).withMessage('At least one branch must be specified')
    .custom((branches) => branches.every((b) => BRANCHES.includes(b)))
    .withMessage(`All branches must be one of: ${BRANCHES.join(', ')}`),
  body('eligibility.maxBacklogs')
    .optional()
    .isInt({ min: 0 }).withMessage('Max backlogs must be a non-negative integer'),
  body('deadline')
    .notEmpty().withMessage('Deadline is required')
    .isISO8601().withMessage('Deadline must be a valid ISO 8601 date'),
];

// ── Drives ────────────────────────────────────────────────────
router.post('/drives', driveValidation, validate, placementController.createDrive);
router.get('/drives', placementController.getMyDrives);

router.put(
  '/drives/:id',
  [param('id').isMongoId().withMessage('Invalid drive ID')],
  validate,
  placementController.updateDrive
);

router.patch(
  '/drives/:id/close',
  [param('id').isMongoId().withMessage('Invalid drive ID')],
  validate,
  placementController.closeDrive
);

router.get(
  '/drives/:id/applicants',
  [
    param('id').isMongoId().withMessage('Invalid drive ID'),
    query('status').optional().isIn(APPLICATION_STATUSES)
      .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
  ],
  validate,
  placementController.getDriveApplicants
);

// ── Applications ──────────────────────────────────────────────
router.patch(
  '/applications/:appId/status',
  [
    param('appId').isMongoId().withMessage('Invalid application ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(APPLICATION_STATUSES)
      .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
    body('remarks').optional().isString(),
    body('interviewDate').optional().isISO8601().withMessage('Interview date must be valid ISO 8601'),
  ],
  validate,
  placementController.updateApplicationStatus
);

router.get(
  '/students/:studentId/resume-view',
  [param('studentId').isMongoId().withMessage('Invalid student ID')],
  validate,
  placementController.getStudentResumeView
);

module.exports = router;
