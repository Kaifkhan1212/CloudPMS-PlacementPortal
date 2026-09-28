/**
 * middleware/auth.middleware.js — JWT Verification Middleware
 *
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded user payload to req.user.
 *
 * Why stateless (for viva)?
 *  - No DB query on every request. The token carries userId + role as
 *    signed claims. The server only needs the secret to verify.
 *  - This makes the API horizontally scalable — any Render instance can
 *    verify any token without shared session state.
 */

'use strict';

const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/generateToken');

const verifyToken = (req, _res, next) => {
  try {
    // ── Extract token from Authorization header ────────────
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Access token missing');
    }

    // ── Verify and decode ──────────────────────────────────
    const decoded = verifyAccessToken(token);

    // Attach to request for downstream middleware/controllers
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Map JWT-specific errors to meaningful HTTP responses
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired — please refresh'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid access token'));
    }
    next(error);
  }
};

module.exports = { verifyToken };
