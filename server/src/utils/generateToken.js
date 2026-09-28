/**
 * utils/generateToken.js — JWT Token Utilities
 *
 * Generates and verifies JWTs for:
 *  - Access tokens  (short-lived, 15 min)  — sent in JSON response body
 *  - Refresh tokens (long-lived, 7 days)   — sent as httpOnly cookie
 *
 * Auth flow (stateless + stateful hybrid, for viva):
 *  - Stateless:  Access token carries claims (userId, role) → no DB lookup
 *                needed per request. Scales horizontally on Render.
 *  - Stateful:   Refresh token is stored in MongoDB. Logout invalidates it
 *                server-side, preventing misuse after sign-out.
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived access token.
 * @param {Object} payload - { userId, role }
 * @returns {string} Signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'cloudpms-api',
    audience: 'cloudpms-client',
  });
};

/**
 * Generate a long-lived refresh token.
 * @param {Object} payload - { userId }
 * @returns {string} Signed JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'cloudpms-api',
    audience: 'cloudpms-client',
  });
};

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'cloudpms-api',
    audience: 'cloudpms-client',
  });
};

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'cloudpms-api',
    audience: 'cloudpms-client',
  });
};

/**
 * Cookie options for the refresh token.
 * httpOnly → JS cannot read it (XSS protection)
 * secure   → HTTPS only in production
 * sameSite → CSRF mitigation
 */
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
};
