'use strict';

const { LOW_TEXT_THRESHOLD } = require('./constants');
const { normalizeRoleId } = require('./keyword-packs');
const { detectFileKind } = require('./signatures');
const { extractPdfText, extractDocxText, normalizeExtractedText } = require('./extractors');
const { buildCvContext, normalizeCvText } = require('./context');
const { createRules } = require('./rules');
const { scoreCvContext } = require('./engine');

class CvAnalyzeError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'CvAnalyzeError';
    this.statusCode = Number(statusCode || 400);
    this.code = String(code || 'cv_analyze_error');
  }
}

function mapValidationErrorToStatus(errorCode) {
  if (errorCode === 'unsupported_mime' || errorCode === 'invalid_signature') return 415;
  if (errorCode === 'file_too_large') return 413;
  return 400;
}

function textPreview(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

async function extractFromFile(file, fileKind) {
  if (fileKind === 'pdf') return extractPdfText(file.buffer);
  if (fileKind === 'docx') return extractDocxText(file.buffer);
  return '';
}

async function analyzeCvPayload({ file, text, targetRole }) {
  const role = normalizeRoleId(targetRole);
  let source = 'text';
  let extractionStatus = 'text_input';
  let normalizedText = '';

  if (file) {
    source = 'file';
    const detection = await detectFileKind(file);
    if (!detection.ok) {
      throw new CvAnalyzeError(
        detection.message || 'Invalid upload.',
        mapValidationErrorToStatus(detection.errorCode),
        detection.errorCode
      );
    }

    try {
      normalizedText = normalizeExtractedText(await extractFromFile(file, detection.kind));
      extractionStatus = 'ok';
    } catch {
      extractionStatus = 'failed';
      normalizedText = '';
    }
  } else {
    normalizedText = normalizeCvText(text);
    if (!normalizedText) {
      throw new CvAnalyzeError('Provide a PDF/DOCX file or paste CV text.', 400, 'missing_input');
    }
  }

  if (source === 'file' && extractionStatus === 'ok' && normalizedText.length < LOW_TEXT_THRESHOLD) {
    extractionStatus = 'low_text';
  }

  const ctx = buildCvContext(normalizedText, { roleId: role });
  const report = scoreCvContext(ctx, createRules());

  return {
    ...report,
    textPreview: textPreview(normalizedText),
    meta: {
      source,
      extractionStatus,
      textLength: normalizedText.length,
      fallbackRecommended: extractionStatus === 'failed' || extractionStatus === 'low_text',
      role,
      timingsMs: {
        validation: 0,
        extraction: 0,
        scoring: 0,
        total: 0,
      },
    },
  };
}

module.exports = {
  CvAnalyzeError,
  analyzeCvPayload,
};
