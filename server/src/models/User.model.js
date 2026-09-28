/**
 * models/User.model.js — User Schema
 *
 * Represents ALL users of the system (students, placement cell staff, admins).
 * Role determines access level — enforced at the middleware layer.
 *
 * Design decisions (for viva):
 *  - Password is NEVER stored in plain text (bcrypt, 12 rounds).
 *  - refreshToken stored in DB enables server-side logout invalidation.
 *  - toJSON transform strips sensitive fields before sending to client.
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['student', 'placement_cell', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be one of: student, placement_cell, admin',
      },
      required: [true, 'Role is required'],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Stored refresh token — null means logged out
    refreshToken: {
      type: String,
      default: null,
      select: false, // Never returned in queries by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// ── Pre-save hook: Hash password before saving ────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password field was modified (avoids re-hashing on profile updates)
  if (!this.isModified('password')) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ── Instance method: Compare passwords ───────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toJSON transform: Strip sensitive fields ──────────────────
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
