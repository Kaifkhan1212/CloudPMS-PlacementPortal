/**
 * config/db.js — MongoDB Atlas connection via Mongoose
 *
 * Cloud computing note (for viva):
 *  - MongoDB Atlas is a fully-managed cloud database service (DBaaS).
 *  - The connection string is stored in .env — NEVER hardcoded.
 *  - Mongoose acts as the ODM (Object-Document Mapper) between Node.js
 *    and MongoDB, enforcing schema validation at the application layer.
 *  - `retryWrites=true` and `w=majority` in the URI ensure write durability
 *    across replica set members (fault tolerance).
 */

'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are the recommended defaults for Mongoose 8+
      // (useNewUrlParser and useUnifiedTopology are no longer needed)
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // ── Connection event listeners ─────────────────────────
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Exit process so the server doesn't start with no DB
    process.exit(1);
  }
};

module.exports = connectDB;
