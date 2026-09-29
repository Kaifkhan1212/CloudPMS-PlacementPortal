/**
 * config/awsClients.js — Centralized AWS SDK client factory
 *
 * Cloud computing note (for viva):
 *  - All AWS service clients are initialised ONCE here and exported.
 *  - Credentials are NOT explicitly passed. The AWS SDK v3 default credential
 *    provider chain resolves them automatically in this order:
 *      1. Environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) —
 *         used for local development.
 *      2. ~/.aws/credentials file — used for local developer machines.
 *      3. EC2 instance profile / ECS task role — used in production when an
 *         IAM role (CloudPMS-EC2-Role) is attached to the EC2 instance.
 *  - No credentials are hardcoded. No secrets in source control.
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

// Only the region is specified. Credentials are resolved by the AWS SDK
// default credential provider chain — IAM role on EC2, env vars locally.
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

// ── S3 — Resume Storage ──────────────────────────────────────
const s3Client = new S3Client(awsConfig);

// ── Textract — Resume Parsing / OCR ─────────────────────────
const textractClient = new TextractClient(awsConfig);

// ── SES — Email Notifications ────────────────────────────────
const sesClient = new SESClient(awsConfig);

module.exports = { s3Client, textractClient, sesClient };
