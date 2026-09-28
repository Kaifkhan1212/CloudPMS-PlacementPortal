/**
 * controllers/auth.controller.js — Authentication Controller
 *
 * Handles:
 *  - POST /register  → Create user account with role
 *  - POST /login     → Verify credentials, issue tokens
 *  - POST /refresh   → Rotate refresh token, issue new access token
 *  - POST /logout    → Invalidate refresh token in DB
 *  - GET  /me        → Return current authenticated user
 *
 * Token strategy (for viva):
 *  - Access token (15m) returned in JSON body — client stores in memory.
 *  - Refresh token (7d) set as httpOnly cookie — invisible to JavaScript
 *    (XSS protection). Only sent to /auth/refresh endpoint.
 *  - On refresh, old token is removed from DB and new one stored
 *    (token rotation — prevents reuse of stolen refresh tokens).
 */

'use strict';

const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
} = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: Issue both tokens and save refresh token to DB ───
const issueTokens = async (user) => {
  const payload = { userId: user._id, role: user.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user._id });

  // Persist refresh token in DB for server-side invalidation
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ────────────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email is already registered');
    }

    // Create user — password hashing handled by pre-save hook in model
    const newUser = await User.create({ name, email, password, role });

    // Issue tokens immediately on registration (auto-login)
    const { accessToken, refreshToken } = await issueTokens(newUser);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: newUser, // toJSON strips password & refreshToken
          accessToken,
        },
        'Account created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must explicitly select password (it's select:false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Generic message — don't reveal whether email exists
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, 'Refresh token missing');
    }

    // Verify the token signature and expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Check token still matches what's stored in DB (rotation check)
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      // Token was already rotated → possible reuse attack → invalidate
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
      throw new ApiError(401, 'Refresh token invalid or already used');
    }

    // Issue fresh token pair (rotation)
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);

    return res.status(200).json(
      new ApiResponse(200, { accessToken }, 'Token refreshed successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Invalidate refresh token in DB
    await User.findByIdAndUpdate(
      req.user.userId,
      { refreshToken: null },
      { new: true }
    );

    // Clear the httpOnly cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json(
      new ApiResponse(200, null, 'Logged out successfully')
    );
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return res.status(200).json(
      new ApiResponse(200, { user }, 'Current user fetched')
    );
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────
// POST /api/auth/google
// ────────────────────────────────────────────────────────────
const googleLogin = async (req, res, next) => {
  try {
    const { token, role } = req.body;
    if (!token) throw new ApiError(400, 'Google token is required');

    // Fetch user info from Google using the access_token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new ApiError(401, 'Invalid Google token');
    }

    const { email, name } = await response.json();
    if (!email) throw new ApiError(401, 'Could not retrieve email from Google');

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: role || 'student',
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return res.status(200).json(
      new ApiResponse(200, { user, accessToken }, 'Google Login successful')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleLogin, refresh, logout, getMe };
