'use strict';

const crypto = require('crypto');
const express = require('express');
const { resolveAllowedFrontendOrigins } = require('../config/urls');
const { getClientIp, rateLimit } = require('../middleware/rateLimit');
const { sendMail: defaultSendMail } = require('../services/email');

const CONTACT_EMAIL_HARD_MAX_CHARS = 320;

class PublicFormPayloadError extends Error {
  constructor(status, message, reason = 'invalid_payload') {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

function numberFromEnv(env, name, fallback, minimum = 1) {
  if (env[name] === undefined || env[name] === null || String(env[name]).trim() === '') return fallback;
  const parsed = Number(env[name]);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.floor(parsed));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmailAddress(value) {
  const email = String(value || '').trim();
  if (email.length > CONTACT_EMAIL_HARD_MAX_CHARS) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function validateFrontendUrl(value, { allowedOrigins, maxChars, label }) {
  const safeUrl = typeof value === 'string' ? value.trim() : '';
  if (!safeUrl) return '';
  if (safeUrl.length > maxChars) {
    throw new PublicFormPayloadError(413, `${label} url too long`, 'url_too_long');
  }

  let parsed;
  try {
    parsed = new URL(safeUrl);
  } catch {
    throw new PublicFormPayloadError(400, `${label} url must be an allowed frontend URL`, 'url_invalid');
  }

  const validProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  const hasCredentials = Boolean(parsed.username || parsed.password);
  if (!validProtocol || hasCredentials || !allowedOrigins.includes(parsed.origin)) {
    throw new PublicFormPayloadError(400, `${label} url must be an allowed frontend URL`, 'url_not_allowed');
  }
  return parsed.href;
}

function contactPayload(body, config) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = normalizeEmail(body?.email);
  const requestedTopic = String(body?.topic || '').trim();
  const topic = ['general', 'billing', 'bug', 'feature'].includes(requestedTopic) ? requestedTopic : 'general';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const url = validateFrontendUrl(body?.url, {
    allowedOrigins: config.allowedOrigins,
    maxChars: config.maxUrlChars,
    label: 'Contact',
  });

  if (!name) throw new PublicFormPayloadError(400, 'Missing "name"', 'name_missing');
  if (name.length > config.contactMaxNameChars) {
    throw new PublicFormPayloadError(413, 'Contact name too long', 'name_too_long');
  }
  if (!email) {
    throw new PublicFormPayloadError(400, 'Please provide a valid email address.', 'email_invalid');
  }
  if (email.length > config.contactMaxEmailChars) {
    throw new PublicFormPayloadError(413, 'Contact email too long', 'email_too_long');
  }
  if (!isValidEmailAddress(email)) {
    throw new PublicFormPayloadError(400, 'Please provide a valid email address.', 'email_invalid');
  }
  if (!message) throw new PublicFormPayloadError(400, 'Missing "message"', 'message_missing');
  if (message.length < config.contactMinMessageChars) {
    throw new PublicFormPayloadError(
      400,
      `Contact message must be at least ${config.contactMinMessageChars} characters`,
      'message_too_short'
    );
  }
  if (message.length > config.contactMaxMessageChars) {
    throw new PublicFormPayloadError(413, 'Contact message too long', 'message_too_long');
  }

  return { name, email, topic, message, url };
}

function bugReportPayload(body, config) {
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const url = validateFrontendUrl(body?.url, {
    allowedOrigins: config.allowedOrigins,
    maxChars: config.maxUrlChars,
    label: 'Bug report',
  });

  if (!note) throw new PublicFormPayloadError(400, 'Missing "note"', 'note_missing');
  if (note.length < config.bugReportMinNoteChars) {
    throw new PublicFormPayloadError(
      400,
      `Bug report note must be at least ${config.bugReportMinNoteChars} characters`,
      'note_too_short'
    );
  }
  if (note.length > config.bugReportMaxNoteChars) {
    throw new PublicFormPayloadError(413, 'Bug report note too long', 'note_too_long');
  }
  return { note, url };
}

function createConfig(env, allowedFrontendOrigins) {
  return {
    allowedOrigins: allowedFrontendOrigins,
    supportEmail: String(env.SUPPORT_EMAIL || 'support@frontendatlas.com').trim() || 'support@frontendatlas.com',
    maxUrlChars: numberFromEnv(env, 'BUG_REPORT_MAX_URL_CHARS', 2000),
    contactBurstWindowMs: numberFromEnv(env, 'CONTACT_BURST_WINDOW_MS', 60_000, 1000),
    contactBurstMax: numberFromEnv(env, 'CONTACT_BURST_MAX', 2),
    contactWindowMs: numberFromEnv(env, 'CONTACT_WINDOW_MS', 3_600_000, 1000),
    contactMax: numberFromEnv(env, 'CONTACT_MAX', 5),
    contactMinMessageChars: numberFromEnv(env, 'CONTACT_MIN_MESSAGE_CHARS', 10),
    contactMaxMessageChars: numberFromEnv(env, 'CONTACT_MAX_MESSAGE_CHARS', 4000),
    contactMaxNameChars: numberFromEnv(env, 'CONTACT_MAX_NAME_CHARS', 120),
    contactMaxEmailChars: Math.min(
      numberFromEnv(env, 'CONTACT_MAX_EMAIL_CHARS', CONTACT_EMAIL_HARD_MAX_CHARS),
      CONTACT_EMAIL_HARD_MAX_CHARS
    ),
    bugReportBurstWindowMs: numberFromEnv(env, 'BUG_REPORT_BURST_WINDOW_MS', 60_000, 1000),
    bugReportBurstMax: numberFromEnv(env, 'BUG_REPORT_BURST_MAX', 2),
    bugReportWindowMs: numberFromEnv(env, 'BUG_REPORT_WINDOW_MS', 3_600_000, 1000),
    bugReportMax: numberFromEnv(env, 'BUG_REPORT_MAX', 5),
    bugReportDuplicateWindowMs: numberFromEnv(env, 'BUG_REPORT_DUP_WINDOW_MS', 600_000, 1000),
    bugReportMinNoteChars: numberFromEnv(env, 'BUG_REPORT_MIN_NOTE_CHARS', 8),
    bugReportMaxNoteChars: numberFromEnv(env, 'BUG_REPORT_MAX_NOTE_CHARS', 4000),
  };
}

function logDecision(form, outcome, reason) {
  const line = `[public-form] form=${form} outcome=${outcome} reason=${reason}`;
  if (outcome === 'accepted') console.info(line);
  else console.warn(line);
}

function sendPayloadError(res, form, error) {
  if (!(error instanceof PublicFormPayloadError)) throw error;
  logDecision(form, 'rejected', error.reason);
  return res.status(error.status).json({ error: error.message });
}

function normalizeBugText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Remembers what one client already reported, so a double submit does not reach the inbox twice.
function createBugReportDuplicateGuard(windowMs) {
  const recent = new Map(); // key -> expiresAt

  return {
    key(sourceIp, note, url) {
      const digest = crypto.createHash('sha256')
        .update(`${normalizeBugText(note)}|${normalizeBugText(url)}`)
        .digest('hex');
      return `${sourceIp}:${digest}`;
    },
    has(key, now = Date.now()) {
      const expiresAt = recent.get(key);
      if (!expiresAt) return false;
      if (now >= expiresAt) {
        recent.delete(key);
        return false;
      }
      return true;
    },
    remember(key, now = Date.now()) {
      recent.set(key, now + windowMs);

      // Opportunistic cleanup to avoid unbounded growth.
      if (recent.size > 10_000 && Math.random() < 0.02) {
        for (const [entry, expiresAt] of recent) {
          if (now >= expiresAt) recent.delete(entry);
        }
      }
    },
  };
}

function createPublicFormsRouter(options = {}) {
  const env = options.env || process.env;
  const allowedOrigins = options.allowedFrontendOrigins || resolveAllowedFrontendOrigins();
  const config = options.config || createConfig(env, allowedOrigins);
  const sendMail = options.sendMail || defaultSendMail;
  const bugReportDuplicates = createBugReportDuplicateGuard(config.bugReportDuplicateWindowMs);
  const router = express.Router();

  router.post(
    '/contact',
    rateLimit({
      name: 'contact-burst',
      windowMs: config.contactBurstWindowMs,
      max: config.contactBurstMax,
      message: 'Please wait a moment before sending another message.',
    }),
    rateLimit({
      name: 'contact-hourly',
      windowMs: config.contactWindowMs,
      max: config.contactMax,
      message: 'Too many messages, please try again later.',
    }),
    async (req, res) => {
      const form = 'contact';

      let payload;
      try {
        payload = contactPayload(req.body, config);
      } catch (error) {
        return sendPayloadError(res, form, error);
      }

      const sentAt = new Date().toISOString();
      const subject = `Contact form from FrontendAtlas: ${payload.topic} - ${payload.name}`;
      const html = `
      <h2 style="margin:0 0 8px">New Contact Message</h2>
      <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeAttr(payload.email)}">${escapeHtml(payload.email)}</a></p>
      <p><strong>Topic:</strong> ${escapeHtml(payload.topic)}</p>
      ${payload.url ? `<p><strong>Page:</strong> <a href="${escapeAttr(payload.url)}">${escapeHtml(payload.url)}</a></p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="white-space:pre-wrap;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto">${escapeHtml(payload.message)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="color:#64748b;font-size:12px;margin:0">Sent ${sentAt}</p>
    `;

      try {
        await sendMail({
          from: `"FrontendAtlas Contact" <${env.SMTP_USER}>`,
          to: config.supportEmail,
          replyTo: payload.email,
          subject,
          text:
            `New contact message\n\n` +
            `Name: ${payload.name}\n` +
            `Email: ${payload.email}\n` +
            `Topic: ${payload.topic}\n` +
            `Page: ${payload.url || '(none)'}\n` +
            `Sent: ${sentAt}\n\n` +
            payload.message,
          html,
        });
      } catch {
        logDecision(form, 'failed', 'smtp_error');
        return res.status(500).json({ error: 'Email send failed' });
      }

      logDecision(form, 'accepted', 'submitted');
      return res.status(204).end();
    }
  );

  router.post(
    '/bug-report',
    rateLimit({
      name: 'bug-report-burst',
      windowMs: config.bugReportBurstWindowMs,
      max: config.bugReportBurstMax,
      message: 'Please wait a moment before sending another bug report.',
    }),
    rateLimit({
      name: 'bug-report-hourly',
      windowMs: config.bugReportWindowMs,
      max: config.bugReportMax,
      message: 'Too many bug reports, please try again later.',
    }),
    async (req, res) => {
      const form = 'bug_report';

      let payload;
      try {
        payload = bugReportPayload(req.body, config);
      } catch (error) {
        return sendPayloadError(res, form, error);
      }

      const duplicateKey = bugReportDuplicates.key(getClientIp(req) || 'unknown', payload.note, payload.url);
      if (bugReportDuplicates.has(duplicateKey)) {
        logDecision(form, 'rejected', 'duplicate');
        return res.status(429).json({ error: 'Duplicate bug report detected. Please wait before sending again.' });
      }

      const sentAt = new Date().toISOString();
      const html = `
      <h2 style="margin:0 0 8px">New Bug Report</h2>
      <p style="white-space:pre-wrap;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto">${escapeHtml(payload.note)}</p>
      ${payload.url ? `<p><strong>Page:</strong> <a href="${escapeAttr(payload.url)}">${escapeHtml(payload.url)}</a></p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="color:#64748b;font-size:12px;margin:0">Sent ${sentAt}</p>
    `;

      try {
        await sendMail({
          from: `"Bug Reporter" <${env.SMTP_USER}>`,
          to: config.supportEmail,
          subject: 'Bug report from FrontendAtlas',
          text: `Bug report:\n\n${payload.note}\n\nPage: ${payload.url || '(none)'}\nSent ${sentAt}`,
          html,
        });
      } catch {
        logDecision(form, 'failed', 'smtp_error');
        return res.status(500).json({ error: 'Email send failed' });
      }

      // Only a delivered report counts, so a failed send can be retried right away.
      bugReportDuplicates.remember(duplicateKey);
      logDecision(form, 'accepted', 'submitted');
      return res.status(204).end();
    }
  );

  return router;
}

module.exports = createPublicFormsRouter();
module.exports.createPublicFormsRouter = createPublicFormsRouter;
module.exports.PublicFormPayloadError = PublicFormPayloadError;
module.exports.contactPayload = contactPayload;
module.exports.bugReportPayload = bugReportPayload;
module.exports.validateFrontendUrl = validateFrontendUrl;
