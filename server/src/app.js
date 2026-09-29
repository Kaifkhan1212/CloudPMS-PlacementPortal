/**
 * app.js — Express Application Configuration
 *
 * Configures and exports the Express app without starting the server.
 * Separation from server.js allows the app to be imported in tests.
 *
 * Middleware stack (order matters):
 *  1. helmet  — Security headers (XSS, clickjacking, MIME sniff protection)
 *  2. cors    — Cross-Origin requests from React frontend
 *  3. morgan  — HTTP request logging
 *  4. json    — Parse JSON request bodies
 *  5. cookies — Parse cookies (for refresh token httpOnly cookie)
 *  6. rate limit — Brute-force protection on /api/auth
 *  7. routes  — All API routes
 *  8. 404     — Catch-all for unknown routes
 *  9. Error handler — Centralised error response formatter
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const apiRouter = require('./routes/index');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');

const app = express();

// ── 1. Security Headers ───────────────────────────────────────
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────
// Cloud note: Origin is restricted to the deployed frontend URL.
// Credentials:true is required for cookies (refresh token) to be sent.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Required for httpOnly cookie to be included
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── 3. Request Logging ────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── 4. Body Parsers ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // Prevent large payload attacks
app.use(express.urlencoded({ extended: true }));

// ── 5. Cookie Parser ─────────────────────────────────────────
app.use(cookieParser());

// ── 6. Rate Limiting ─────────────────────────────────────────
// Protects auth endpoints from brute-force and credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // Relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: new ApiResponse(429, null, 'Too many requests — please try again after 15 minutes'),
  skip: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});
app.use('/api/auth', authLimiter);

// ── 7. Health Check (no auth needed — for EC2/uptime monitor) ──
// AWS_REGION and AWS_S3_BUCKET_NAME must be set in all environments.
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are intentionally NOT checked
// here because on EC2 with an attached IAM role those env vars are absent —
// the SDK obtains temporary credentials from the instance metadata service.
app.get('/api/health', (_req, res) => {
  const awsConfigured = !!(
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET_NAME
  );

  const awsStatus = {
    configured: awsConfigured,
    region: process.env.AWS_REGION || 'missing',
    s3Bucket: process.env.AWS_S3_BUCKET_NAME || 'missing',
    sesSender: process.env.AWS_SES_SENDER_EMAIL || 'missing',
    textractReady: awsConfigured,
  };

  res.status(200).json(
    new ApiResponse(200, {
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      aws: awsStatus
    }, 'CloudPMS API is healthy')
  );
});

// ── 8. API Routes ─────────────────────────────────────────────
app.get('/', (req, res) => res.status(200).json({ success: true, message: 'CloudPMS API is running' }));
app.use('/api', apiRouter);

// ── 9. 404 — Unknown Route ────────────────────────────────────
app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// ── 10. Global Error Handler ─────────────────────────────────
// Centralised error formatting — all ApiErrors and unexpected errors
// are caught here and returned in a uniform JSON shape.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log unexpected server errors (but not client-side 4xx)
  if (statusCode >= 500) {
    console.error('SERVER ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
