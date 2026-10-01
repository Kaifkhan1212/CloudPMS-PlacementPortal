'use strict';

const mongoose = require('mongoose');

const EMAIL_TYPES = ['manual', 'application_confirmation', 'status_update'];
const EMAIL_STATUSES = ['sent', 'failed'];

const emailLogSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
    },
    recipients: [
      {
        type: String,
        required: true,
      }
    ],
    subject: {
      type: String,
      required: true,
    },
    messageText: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: EMAIL_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: EMAIL_STATUSES,
      required: true,
    },
    relatedDriveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
    },
    relatedApplicationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      }
    ],
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Who triggered this email (e.g., placement cell user)
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
module.exports.EMAIL_TYPES = EMAIL_TYPES;
module.exports.EMAIL_STATUSES = EMAIL_STATUSES;
