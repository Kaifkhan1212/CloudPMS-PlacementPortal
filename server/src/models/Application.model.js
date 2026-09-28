/**
 * models/Application.model.js — Job Application Schema
 *
 * Links a StudentProfile to a Drive with a status lifecycle.
 *
 * Status lifecycle:
 *   Applied → Shortlisted → Interview Scheduled → Selected | Rejected
 *
 * Compound unique index on { student, drive } prevents a student from
 * applying to the same drive more than once (enforced at DB level, not
 * just application level — defence in depth).
 */

'use strict';

const mongoose = require('mongoose');

const APPLICATION_STATUSES = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student reference is required'],
    },

    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
    },

    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
      },
      default: 'Applied',
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    // Optional notes by placement cell (e.g., interview round, feedback)
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Compound unique index ─────────────────────────────────────
// Prevents duplicate applications at the database level
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

// ── Additional indexes for common queries ─────────────────────
applicationSchema.index({ drive: 1, status: 1 }); // "All shortlisted for Drive X"
applicationSchema.index({ student: 1 });            // "All applications by Student Y"

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
