/**
 * utils/ApiResponse.js — Uniform Success Response Wrapper
 *
 * Every successful API response follows this shape:
 * {
 *   statusCode: 200,
 *   success: true,
 *   message: "...",
 *   data: { ... }
 * }
 *
 * Cloud API design note (for viva):
 *  - Uniform response envelopes make it easy to consume the API from
 *    any frontend (React) or third-party client without guessing the shape.
 *  - "success" flag lets the client branch on a single boolean check.
 *
 * Usage:
 *   return res.status(200).json(new ApiResponse(200, userData, 'Login successful'));
 */

'use strict';

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

module.exports = ApiResponse;
