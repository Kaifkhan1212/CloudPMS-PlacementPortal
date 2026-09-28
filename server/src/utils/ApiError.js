/**
 * utils/ApiError.js — Custom Error Class
 *
 * Extends the native Error object so all thrown errors carry:
 *  - statusCode  → HTTP status sent to client
 *  - message     → Human-readable description
 *  - errors      → Array of field-level validation errors (optional)
 *  - success     → Always false (uniform shape)
 *
 * Usage:
 *   throw new ApiError(404, 'User not found');
 *   throw new ApiError(422, 'Validation failed', errArray);
 */

'use strict';

class ApiError extends Error {
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
