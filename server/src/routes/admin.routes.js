/**
 * routes/admin.routes.js — Admin Module Routes
 *
 * Access: admin only
 *
 *   GET    /dashboard           → Summary statistics
 *   GET    /users               → List all users (paginated, filterable)
 *   PATCH  /users/:id/toggle    → Deactivate / reactivate account
 *   GET    /reports/drives      → Drive-wise application & selection report
 */

'use strict';

const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../models/User.model');

router.use(verifyToken, allowRoles('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get(
  '/users',
  [
    query('role').optional().isIn(ROLES)
      .withMessage(`Role filter must be one of: ${ROLES.join(', ')}`),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  ],
  validate,
  adminController.getAllUsers
);

router.patch(
  '/users/:id/toggle',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  adminController.toggleUserStatus
);

router.get('/reports/drives', adminController.getDriveReport);

module.exports = router;
