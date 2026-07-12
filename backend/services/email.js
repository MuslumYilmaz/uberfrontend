const nodemailer = require('nodemailer');

function smtpConfig() {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  if (!user || !pass) {
    const error = new Error('SMTP is not configured');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }
  return {
    user,
    transport: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user, pass },
    },
  };
}

async function sendMail(message) {
  const { user, transport } = smtpConfig();
  const transporter = nodemailer.createTransport(transport);
  return transporter.sendMail({
    from: `"FrontendAtlas" <${user}>`,
    ...message,
  });
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

async function sendEmailVerificationMail({ to, verificationUrl, purpose }) {
  const changingEmail = purpose === 'change_email';
  const heading = changingEmail ? 'Confirm your new email' : 'Verify your email';
  const safeUrl = escapeHtml(verificationUrl);
  return sendMail({
    to,
    subject: `${heading} for FrontendAtlas`,
    text: `${heading}\n\nOpen this link within 30 minutes:\n${verificationUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<h2>${heading}</h2><p>Open this link within 30 minutes:</p><p><a href="${safeUrl}">${safeUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendMail, sendEmailVerificationMail };
