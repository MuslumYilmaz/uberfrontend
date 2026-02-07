'use strict';

const express = require('express');
const request = require('supertest');
const JSZip = require('jszip');
const toolsRouter = require('../routes/tools');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tools', toolsRouter);
  return app;
}

async function makeMinimalDocx(text) {
  const safeText = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${safeText}</w:t></w:r></w:p>
  </w:body>
</w:document>`
  );

  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('POST /api/tools/cv/analyze', () => {
  test('analyzes pasted text payload', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/tools/cv/analyze')
      .send({
        targetRole: 'senior_frontend_angular',
        text: `
John Doe
john@example.com
linkedin.com/in/johndoe

Experience
- Built Angular features and improved performance by 25%.

Skills
Angular, RxJS, testing, accessibility
        `.trim(),
      });

    expect(response.status).toBe(200);
    expect(response.body.meta.extractionStatus).toBe('text_input');
    expect(response.body.scores.overall).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(response.body.issues)).toBe(true);
  });

  test('returns 400 when both file and text are missing', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/tools/cv/analyze')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/provide/i);
  });

  test('returns 413 for oversized uploads', async () => {
    const app = createApp();
    const oversized = Buffer.alloc((5 * 1024 * 1024) + 32, 0x61);

    const response = await request(app)
      .post('/api/tools/cv/analyze')
      .attach('file', oversized, { filename: 'cv.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(413);
  });

  test('returns 415 for unsupported signature', async () => {
    const app = createApp();
    const fakePdf = Buffer.from('NOT A PDF', 'utf8');

    const response = await request(app)
      .post('/api/tools/cv/analyze')
      .attach('file', fakePdf, { filename: 'cv.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(415);
    expect(response.body.error).toMatch(/signature|pdf|docx/i);
  });

  test('returns low_text for short extracted DOCX text', async () => {
    const app = createApp();
    const tinyDocx = await makeMinimalDocx('Tiny CV');

    const response = await request(app)
      .post('/api/tools/cv/analyze')
      .attach('file', tinyDocx, {
        filename: 'cv.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    expect(response.status).toBe(200);
    expect(response.body.meta.extractionStatus).toBe('low_text');
    expect(response.body.meta.fallbackRecommended).toBe(true);
  });
});
