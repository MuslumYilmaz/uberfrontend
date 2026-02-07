'use strict';

const JSZip = require('jszip');
const { ALLOWED_MIME_TYPES } = require('../services/tools/cv/constants');
const {
  detectFileKind,
  hasDocxContentTypes,
  isPdfSignature,
  isZipSignature,
} = require('../services/tools/cv/signatures');

async function makeDocxLikeBuffer() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:document>');
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('cv-linter file signatures', () => {
  test('detects valid PDF signature', () => {
    const buffer = Buffer.from('%PDF-1.7\n1 0 obj\n', 'utf8');
    expect(isPdfSignature(buffer)).toBe(true);
  });

  test('rejects invalid PDF signature', () => {
    const buffer = Buffer.from('NOT_PDF', 'utf8');
    expect(isPdfSignature(buffer)).toBe(false);
  });

  test('detects zip and content types for DOCX-like container', async () => {
    const buffer = await makeDocxLikeBuffer();
    expect(isZipSignature(buffer)).toBe(true);
    await expect(hasDocxContentTypes(buffer)).resolves.toBe(true);
  });

  test('requires MIME and matching signature together', async () => {
    const docxBuffer = await makeDocxLikeBuffer();

    const wrongMimeResult = await detectFileKind({
      mimetype: ALLOWED_MIME_TYPES.pdf,
      size: docxBuffer.length,
      buffer: docxBuffer,
    });
    expect(wrongMimeResult.ok).toBe(false);
    expect(wrongMimeResult.errorCode).toBe('invalid_signature');

    const validDocxResult = await detectFileKind({
      mimetype: ALLOWED_MIME_TYPES.docx,
      size: docxBuffer.length,
      buffer: docxBuffer,
    });
    expect(validDocxResult.ok).toBe(true);
    expect(validDocxResult.kind).toBe('docx');
  });
});
