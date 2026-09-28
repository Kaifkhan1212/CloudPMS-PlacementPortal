/**
 * routes/auth.routes.js — Authentication Routes
 *
 * Public routes:  register, login, refresh (token in cookie)
 * Protected:      logout, /me (require valid access token)
 *
 * Validation chains use express-validator.
 * The `validate` middleware converts errors into ApiError(422).
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../models/User.model');

// ── Validation chains ─────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────

// Public
router.post('/register', registerValidation, validate, authController.register);
router.post('/login',    loginValidation,    validate, authController.login);
router.post('/google',   authController.googleLogin);
router.post('/refresh',                               authController.refresh);

// Protected (access token required)
router.post('/logout', verifyToken, authController.logout);
router.get('/me',      verifyToken, authController.getMe);

module.exports = router;
