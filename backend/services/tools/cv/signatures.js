'use strict';

const JSZip = require('jszip');
const { ALLOWED_MIME_SET, ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } = require('./constants');

function isPdfSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  return buffer.slice(0, 4).toString('ascii') === '%PDF';
}

function isZipSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  const a = buffer[0];
  const b = buffer[1];
  const c = buffer[2];
  const d = buffer[3];
  if (a !== 0x50 || b !== 0x4b) return false;
  return (
    (c === 0x03 && d === 0x04) ||
    (c === 0x05 && d === 0x06) ||
    (c === 0x07 && d === 0x08)
  );
}

async function hasDocxContentTypes(buffer) {
  if (!isZipSignature(buffer)) return false;
  try {
    const zip = await JSZip.loadAsync(buffer, { checkCRC32: false, createFolders: false });
    return !!zip.file('[Content_Types].xml');
  } catch {
    return false;
  }
}

async function detectFileKind(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    return { ok: false, errorCode: 'missing_file', message: 'Missing upload file.' };
  }

  const size = Number(file.size || file.buffer.length || 0);
  if (size <= 0) {
    return { ok: false, errorCode: 'empty_file', message: 'Uploaded file is empty.' };
  }
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, errorCode: 'file_too_large', message: 'File too large. Max 5MB.' };
  }

  const mime = String(file.mimetype || '').toLowerCase().trim();
  if (!ALLOWED_MIME_SET.has(mime)) {
    return { ok: false, errorCode: 'unsupported_mime', message: 'Only PDF and DOCX are supported.' };
  }

  if (mime === ALLOWED_MIME_TYPES.pdf) {
    if (!isPdfSignature(file.buffer)) {
      return { ok: false, errorCode: 'invalid_signature', message: 'Invalid PDF file signature.' };
    }
    return { ok: true, kind: 'pdf' };
  }

  if (mime === ALLOWED_MIME_TYPES.docx) {
    const isDocx = await hasDocxContentTypes(file.buffer);
    if (!isDocx) {
      return { ok: false, errorCode: 'invalid_signature', message: 'Invalid DOCX file signature.' };
    }
    return { ok: true, kind: 'docx' };
  }

  return { ok: false, errorCode: 'unsupported_mime', message: 'Only PDF and DOCX are supported.' };
}

module.exports = {
  detectFileKind,
  isPdfSignature,
  isZipSignature,
  hasDocxContentTypes,
};
