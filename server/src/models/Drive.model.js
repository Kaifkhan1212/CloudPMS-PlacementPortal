/**
 * models/Drive.model.js — Placement Drive Schema
 *
 * Represents a company's recruitment drive posted by the Placement Cell.
 *
 * Eligibility sub-document design (for viva):
 *  - Embedded as a sub-document (not a ref) because eligibility criteria
 *    are always fetched together with the drive — no extra DB round-trip.
 *  - allowedBranches references the same BRANCHES list as StudentProfile
 *    for consistent filtering.
 */

'use strict';

const mongoose = require('mongoose');
const { BRANCHES } = require('./StudentProfile.model');

const DRIVE_STATUSES = ['Upcoming', 'Ongoing', 'Completed'];

// ── Eligibility sub-schema ────────────────────────────────────
const eligibilitySchema = new mongoose.Schema(
  {
    minCgpa: {
      type: Number,
      required: [true, 'Minimum CGPA is required'],
      min: 0,
      max: 10,
    },
    allowedBranches: {
      type: [String],
      enum: BRANCHES,
      required: [true, 'At least one allowed branch is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one branch must be specified',
      },
    },
    maxBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false } // No separate _id for embedded sub-document
);

// ── Drive schema ──────────────────────────────────────────────
const driveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },

    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },

    // CTC in Lakhs Per Annum
    ctc: {
      type: Number,
      required: [true, 'CTC is required'],
      min: [0, 'CTC cannot be negative'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    eligibility: {
      type: eligibilitySchema,
      required: [true, 'Eligibility criteria are required'],
    },

    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },

    driveDate: {
      type: Date,
    },

    venue: {
      type: String,
      trim: true,
    },

    // Ref to placement_cell user who created this drive
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: DRIVE_STATUSES,
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
driveSchema.index({ deadline: 1 });          // Sort by deadline
driveSchema.index({ status: 1 });            // Filter by status
driveSchema.index({ 'eligibility.minCgpa': 1 }); // Eligibility query

const Drive = mongoose.model('Drive', driveSchema);

module.exports = Drive;
module.exports.DRIVE_STATUSES = DRIVE_STATUSES;
