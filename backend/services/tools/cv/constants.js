'use strict';

const CATEGORY_MAX_SCORES = Object.freeze({
  ats: 25,
  structure: 20,
  impact: 25,
  consistency: 15,
  keywords: 15,
});

const CATEGORY_LABELS = Object.freeze({
  ats: 'ATS & Readability',
  structure: 'Structure & Completeness',
  impact: 'Impact & Evidence',
  consistency: 'Consistency & Hygiene',
  keywords: 'Keyword Coverage',
});

const SEVERITY_ORDER = Object.freeze({
  critical: 0,
  warn: 1,
  info: 2,
});

const ALLOWED_MIME_TYPES = Object.freeze({
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

const ALLOWED_MIME_SET = new Set(Object.values(ALLOWED_MIME_TYPES));
const LOW_TEXT_THRESHOLD = 500;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

module.exports = {
  CATEGORY_LABELS,
  CATEGORY_MAX_SCORES,
  SEVERITY_ORDER,
  ALLOWED_MIME_TYPES,
  ALLOWED_MIME_SET,
  LOW_TEXT_THRESHOLD,
  MAX_UPLOAD_BYTES,
};
