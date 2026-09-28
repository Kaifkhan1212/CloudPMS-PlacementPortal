/**
 * server.js — Entry point for CloudPMS API
 *
 * Responsibilities:
 *  - Load environment variables
 *  - Connect to MongoDB (cloud service boundary #1)
 *  - Start the HTTP server
 *
 * Why keep this separate from app.js?
 *  → app.js exports the Express app for testing without starting the server.
 *  → Clean separation allows Jest/Supertest to import the app in isolation.
 */

'use strict';

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// ── Boot sequence ────────────────────────────────────────────
(async () => {
  try {
    // 1. Connect to MongoDB Atlas (external cloud service)
    await connectDB();

    // 2. Start listening — only after DB is ready
    app.listen(PORT, () => {
      console.log(`\n🚀 CloudPMS Server running in [${process.env.NODE_ENV}] mode`);
      console.log(`   ➜  Local:  http://localhost:${PORT}`);
      console.log(`   ➜  Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
})();

// ── Graceful shutdown ────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION — shutting down:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received — graceful shutdown');
  process.exit(0);
});
