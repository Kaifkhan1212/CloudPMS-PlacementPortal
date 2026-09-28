/**
 * models/StudentProfile.model.js — Student Profile Schema
 *
 * Stores academic and placement-related data for students.
 * Kept separate from User for clean separation:
 *  - User handles identity/auth
 *  - StudentProfile handles academic/placement data
 *
 * Branches reflect actual college programs (MCA, BCA, BBA, BSc IT, BCom).
 */

'use strict';

const mongoose = require('mongoose');

// College programs offered — update here if new programs are added
const BRANCHES = ['MCA', 'BCA', 'BBA', 'BSc IT', 'BCom'];

const studentProfileSchema = new mongoose.Schema(
  {
    // 1-to-1 link to User — unique ensures one profile per user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },

    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },

    branch: {
      type: String,
      enum: {
        values: BRANCHES,
        message: `Branch must be one of: ${BRANCHES.join(', ')}`,
      },
      required: [true, 'Branch is required'],
    },

    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },

    backlogCount: {
      type: Number,
      default: 0,
      min: [0, 'Backlog count cannot be negative'],
    },

    // AWS S3 object key or full URL — populated after resume upload
    resumePath: {
      type: String,
      default: null,
    },

    // Extracted from resume via AWS Textract (Phase 2)
    skills: {
      type: [String],
      default: [],
    },

    // Academic background (optional but useful for eligibility filters)
    tenthPercent: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },

    twelfthPercent: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },

    // Set to true when student is Selected in any application
    isPlaced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
// Compound index for drive eligibility queries:
// "find all MCA students with CGPA >= 7.0 and backlogCount <= 0"
studentProfileSchema.index({ branch: 1, cgpa: 1, backlogCount: 1 });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
module.exports.BRANCHES = BRANCHES;
