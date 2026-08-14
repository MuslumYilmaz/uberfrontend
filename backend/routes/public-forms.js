'use strict';

const express = require('express');
const { resolveAllowedFrontendOrigins } = require('../config/urls');
const { getClientIp } = require('../middleware/rateLimit');
const { sendMail: defaultSendMail } = require('../services/email');
const {
  PublicFormProtectionError,
  claimDuplicate,
  consumeQuota,
  createPublicFormStore,
  fingerprint,
  protectionUnavailableError,
  releaseDuplicate,
  verifyTurnstile: defaultVerifyTurnstile,
} = require('../services/public-form-protection');

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
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
  if (!email || !isValidEmailAddress(email)) {
    throw new PublicFormPayloadError(400, 'Please provide a valid email address.', 'email_invalid');
  }
  if (email.length > config.contactMaxEmailChars) {
    throw new PublicFormPayloadError(413, 'Contact email too long', 'email_too_long');
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
    maxUrlChars: numberFromEnv(env, 'PUBLIC_FORM_MAX_URL_CHARS', numberFromEnv(env, 'BUG_REPORT_MAX_URL_CHARS', 2000)),
    duplicateWindowMs: numberFromEnv(env, 'PUBLIC_FORM_DUP_WINDOW_MS', numberFromEnv(env, 'BUG_REPORT_DUP_WINDOW_MS', 600_000), 1000),
    contactBurstWindowMs: numberFromEnv(env, 'CONTACT_BURST_WINDOW_MS', 60_000, 1000),
    contactBurstMax: numberFromEnv(env, 'CONTACT_BURST_MAX', 2),
    contactWindowMs: numberFromEnv(env, 'CONTACT_WINDOW_MS', 3_600_000, 1000),
    contactMax: numberFromEnv(env, 'CONTACT_MAX', 5),
    contactEmailHourlyWindowMs: numberFromEnv(env, 'CONTACT_EMAIL_HOURLY_WINDOW_MS', 3_600_000, 1000),
    contactEmailHourlyMax: numberFromEnv(env, 'CONTACT_EMAIL_HOURLY_MAX', 3),
    contactEmailDailyWindowMs: numberFromEnv(env, 'CONTACT_EMAIL_DAILY_WINDOW_MS', 86_400_000, 1000),
    contactEmailDailyMax: numberFromEnv(env, 'CONTACT_EMAIL_DAILY_MAX', 5),
    contactMinMessageChars: numberFromEnv(env, 'CONTACT_MIN_MESSAGE_CHARS', 10),
    contactMaxMessageChars: numberFromEnv(env, 'CONTACT_MAX_MESSAGE_CHARS', 4000),
    contactMaxNameChars: numberFromEnv(env, 'CONTACT_MAX_NAME_CHARS', 120),
    contactMaxEmailChars: numberFromEnv(env, 'CONTACT_MAX_EMAIL_CHARS', 320),
    bugReportBurstWindowMs: numberFromEnv(env, 'BUG_REPORT_BURST_WINDOW_MS', 60_000, 1000),
    bugReportBurstMax: numberFromEnv(env, 'BUG_REPORT_BURST_MAX', 2),
    bugReportWindowMs: numberFromEnv(env, 'BUG_REPORT_WINDOW_MS', 3_600_000, 1000),
    bugReportMax: numberFromEnv(env, 'BUG_REPORT_MAX', 5),
    bugReportMinNoteChars: numberFromEnv(env, 'BUG_REPORT_MIN_NOTE_CHARS', 8),
    bugReportMaxNoteChars: numberFromEnv(env, 'BUG_REPORT_MAX_NOTE_CHARS', 4000),
  };
}

function logDecision(form, outcome, reason) {
  const line = `[public-form] form=${form} outcome=${outcome} reason=${reason}`;
  if (outcome === 'accepted') console.info(line);
  else console.warn(line);
}

function isHoneypotFilled(value) {
  if (value === undefined || value === null) return false;
  return String(value).trim().length > 0;
}

function sendProtectionError(res, form, error) {
  const safeError = error instanceof PublicFormProtectionError
    ? error
    : protectionUnavailableError('protection_internal_error');
  if (safeError.retryAfter) res.setHeader('Retry-After', String(safeError.retryAfter));
  logDecision(form, 'rejected', safeError.reason || 'protection_error');
  return res.status(safeError.status).json({ code: safeError.code, error: safeError.message });
}

async function protectIp({ store, form, sourceIp, config }) {
  const isContact = form === 'contact';
  await consumeQuota({
    store,
    scope: `${form}:ip:burst`,
    value: sourceIp,
    max: isContact ? config.contactBurstMax : config.bugReportBurstMax,
    windowMs: isContact ? config.contactBurstWindowMs : config.bugReportBurstWindowMs,
    reason: 'ip_burst_limit',
  });
  await consumeQuota({
    store,
    scope: `${form}:ip:hourly`,
    value: sourceIp,
    max: isContact ? config.contactMax : config.bugReportMax,
    windowMs: isContact ? config.contactWindowMs : config.bugReportWindowMs,
    reason: 'ip_hourly_limit',
  });
}

function createPublicFormsRouter(options = {}) {
  const env = options.env || process.env;
  const allowedOrigins = options.allowedFrontendOrigins || resolveAllowedFrontendOrigins();
  const config = options.config || createConfig(env, allowedOrigins);
  const store = options.store || createPublicFormStore({ env, fetchImpl: options.redisFetch });
  const sendMail = options.sendMail || defaultSendMail;
  const verifyTurnstile = options.verifyTurnstile || defaultVerifyTurnstile;
  const router = express.Router();

  router.post('/contact', async (req, res) => {
    const form = 'contact';
    const sourceIp = getClientIp(req);

    try {
      await protectIp({ store, form, sourceIp, config });
    } catch (error) {
      return sendProtectionError(res, form, error);
    }

    if (isHoneypotFilled(req.body?.website)) {
      logDecision(form, 'rejected', 'honeypot');
      return res.status(204).end();
    }

    let payload;
    try {
      payload = contactPayload(req.body, config);
    } catch (error) {
      if (error instanceof PublicFormPayloadError) {
        logDecision(form, 'rejected', error.reason);
        return res.status(error.status).json({ error: error.message });
      }
      return sendProtectionError(res, form, error);
    }

    try {
      await verifyTurnstile({
        token: req.body?.verificationToken,
        expectedAction: 'contact',
        remoteIp: sourceIp,
        env,
      });
      await consumeQuota({
        store,
        scope: 'contact:email:hourly',
        value: payload.email,
        max: config.contactEmailHourlyMax,
        windowMs: config.contactEmailHourlyWindowMs,
        reason: 'email_hourly_limit',
      });
      await consumeQuota({
        store,
        scope: 'contact:email:daily',
        value: payload.email,
        max: config.contactEmailDailyMax,
        windowMs: config.contactEmailDailyWindowMs,
        reason: 'email_daily_limit',
      });
    } catch (error) {
      return sendProtectionError(res, form, error);
    }

    let duplicateClaim;
    try {
      duplicateClaim = await claimDuplicate({
        store,
        scope: 'contact',
        value: fingerprint([payload.email, payload.topic, payload.message, payload.url]),
        windowMs: config.duplicateWindowMs,
      });
    } catch (error) {
      return sendProtectionError(res, form, error);
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
      try {
        await releaseDuplicate(store, duplicateClaim);
      } catch {
        logDecision(form, 'failed', 'duplicate_release_failed');
      }
      logDecision(form, 'failed', 'smtp_error');
      return res.status(500).json({ error: 'Email send failed' });
    }

    logDecision(form, 'accepted', 'submitted');
    return res.status(204).end();
  });

  router.post('/bug-report', async (req, res) => {
    const form = 'bug_report';
    const sourceIp = getClientIp(req);

    try {
      await protectIp({ store, form, sourceIp, config });
    } catch (error) {
      return sendProtectionError(res, form, error);
    }

    if (isHoneypotFilled(req.body?.website)) {
      logDecision(form, 'rejected', 'honeypot');
      return res.status(204).end();
    }

    let payload;
    try {
      payload = bugReportPayload(req.body, config);
    } catch (error) {
      if (error instanceof PublicFormPayloadError) {
        logDecision(form, 'rejected', error.reason);
        return res.status(error.status).json({ error: error.message });
      }
      return sendProtectionError(res, form, error);
    }

    try {
      await verifyTurnstile({
        token: req.body?.verificationToken,
        expectedAction: 'bug_report',
        remoteIp: sourceIp,
        env,
      });
    } catch (error) {
      return sendProtectionError(res, form, error);
    }

    let duplicateClaim;
    try {
      duplicateClaim = await claimDuplicate({
        store,
        scope: 'bug-report',
        value: fingerprint([sourceIp, payload.note, payload.url]),
        windowMs: config.duplicateWindowMs,
      });
    } catch (error) {
      return sendProtectionError(res, form, error);
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
      try {
        await releaseDuplicate(store, duplicateClaim);
      } catch {
        logDecision(form, 'failed', 'duplicate_release_failed');
      }
      logDecision(form, 'failed', 'smtp_error');
      return res.status(500).json({ error: 'Email send failed' });
    }

    logDecision(form, 'accepted', 'submitted');
    return res.status(204).end();
  });

  return router;
}

module.exports = createPublicFormsRouter();
module.exports.createPublicFormsRouter = createPublicFormsRouter;
module.exports.PublicFormPayloadError = PublicFormPayloadError;
module.exports.contactPayload = contactPayload;
module.exports.bugReportPayload = bugReportPayload;
module.exports.validateFrontendUrl = validateFrontendUrl;
