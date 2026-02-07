'use strict';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

function normalizeExtractedText(rawText) {
  return String(rawText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdfText(buffer) {
  const parsed = await pdfParse(buffer);
  return normalizeExtractedText(parsed?.text || '');
}

async function extractDocxText(buffer) {
  const parsed = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(parsed?.value || '');
}

module.exports = {
  normalizeExtractedText,
  extractPdfText,
  extractDocxText,
};
