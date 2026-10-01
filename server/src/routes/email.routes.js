'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const emailController = require('../controllers/email.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(verifyToken, allowRoles('placement_cell'));

const sendEmailValidation = [
  body('recipientMode').isIn(['single', 'multiple', 'all_applicants', 'shortlisted', 'interview_scheduled', 'selected']),
  body('recipients').optional().isArray(),
  body('driveId').optional().isMongoId(),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

router.post('/send', sendEmailValidation, validate, emailController.sendManualEmail);
router.get('/', emailController.getEmailLogs);
router.get('/:id', [param('id').isMongoId()], validate, emailController.getEmailLogDetails);

module.exports = router;
