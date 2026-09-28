/**
 * middleware/validate.middleware.js — express-validator Error Handler
 *
 * Reads validation errors produced by express-validator's check() chains
 * and short-circuits the request with a 422 if any errors exist.
 *
 * Usage (in route file):
 *   router.post('/register', registerValidation, validate, authController.register);
 */

'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new ApiError(422, 'Validation failed', extractedErrors));
  }

  next();
};

module.exports = { validate };
