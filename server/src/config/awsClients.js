/**
 * config/awsClients.js — Centralized AWS SDK client factory
 *
 * Cloud computing note (for viva):
 *  - All AWS service clients are initialised ONCE here and exported.
 *  - Credentials come exclusively from environment variables (12-factor app).
 *  - In production (Render), credentials are injected via env vars — no
 *    hardcoded secrets. On EC2/Lambda you would use IAM roles instead.
 *
 * AWS services used in this project:
 *  ┌─────────────────┬──────────────────────────────────────────┐
 *  │ Service         │ Purpose                                  │
 *  ├─────────────────┼──────────────────────────────────────────┤
 *  │ S3              │ Resume file storage (cloud object store) │
 *  │ Textract        │ Resume OCR / text extraction             │
 *  │ SES             │ Transactional email notifications        │
 *  └─────────────────┴──────────────────────────────────────────┘
 */

'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const { TextractClient } = require('@aws-sdk/client-textract');
const { SESClient } = require('@aws-sdk/client-ses');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// ── S3 — Resume Storage ──────────────────────────────────────
const s3Client = new S3Client(awsConfig);

// ── Textract — Resume Parsing / OCR ─────────────────────────
const textractClient = new TextractClient(awsConfig);

// ── SES — Email Notifications ────────────────────────────────
const sesClient = new SESClient(awsConfig);

module.exports = { s3Client, textractClient, sesClient };
