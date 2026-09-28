/**
 * middleware/upload.middleware.js — Multer File Upload Config
 *
 * Uses memoryStorage() — file is held as a Buffer in memory (req.file.buffer)
 * and streamed directly to AWS S3. No temp files written to disk.
 *
 * Constraints:
 *  - Only PDF files accepted (resume uploads)
 *  - Max size: 5 MB
 */

'use strict';

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF files are accepted for resume upload'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB hard cap
  },
});

module.exports = { upload };
