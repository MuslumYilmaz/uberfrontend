'use strict';

const express = require('express');
const multer = require('multer');
const { MAX_UPLOAD_BYTES } = require('../services/tools/cv/constants');
const { CvAnalyzeError, analyzeCvPayload } = require('../services/tools/cv/analyze');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
});

function maybeMultipartUpload(req, res, next) {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('multipart/form-data')) return next();

  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Max 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Use multipart field "file" for upload.' });
    }
    return res.status(400).json({ error: 'Invalid multipart upload.' });
  });
}

router.post('/cv/analyze', maybeMultipartUpload, async (req, res) => {
  try {
    const bodyText = typeof req.body?.text === 'string' ? req.body.text : '';
    const targetRole = typeof req.body?.targetRole === 'string' ? req.body.targetRole : '';
    const file = req.file || null;

    if (!file && !bodyText.trim()) {
      return res.status(400).json({ error: 'Provide a PDF/DOCX file or paste CV text.' });
    }

    const report = await analyzeCvPayload({ file, text: bodyText, targetRole });
    return res.json(report);
  } catch (err) {
    if (err instanceof CvAnalyzeError) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    const name = err?.name || 'Error';
    const message = err?.message || 'Unknown error';
    console.error(`[cv-linter] route failure (${name}): ${message}`);
    return res.status(500).json({ error: 'Failed to analyze CV.' });
  }
});

module.exports = router;
