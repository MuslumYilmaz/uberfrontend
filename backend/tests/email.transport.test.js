'use strict';

const nodemailer = require('nodemailer');
const { sendMail, sendEmailVerificationMail, sendPasswordResetMail } = require('../services/email');

describe('email service with the installed Nodemailer transport', () => {
  const smtpKeys = ['SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE'];
  let previousEnv;
  let transportSpy;

  beforeEach(() => {
    previousEnv = Object.fromEntries(smtpKeys.map((key) => [key, process.env[key]]));
    Object.assign(process.env, {
      SMTP_USER: 'noreply@example.com', SMTP_PASS: 'test-only-password',
      SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_SECURE: 'true',
    });
    const createTransport = nodemailer.createTransport.bind(nodemailer);
    // Exercise the real CommonJS API and MIME composer without opening an SMTP connection.
    transportSpy = jest.spyOn(nodemailer, 'createTransport').mockImplementation(() =>
      createTransport({ streamTransport: true, buffer: true, newline: 'unix' }));
  });

  afterEach(() => {
    transportSpy.mockRestore();
    for (const key of smtpKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  });

  test.each([
    ['verification', sendEmailVerificationMail, 'verificationUrl', 'Verify your email for FrontendAtlas'],
    ['password reset', sendPasswordResetMail, 'resetUrl', 'Reset your FrontendAtlas password'],
  ])('composes a deliverable %s email with text and HTML alternatives', async (_label, send, linkKey, subject) => {
    const info = await send({ to: 'member@example.com', [linkKey]: 'https://frontendatlas.com/auth/confirm?token=test-token' });
    expect(transportSpy).toHaveBeenCalledWith({
      host: 'smtp.example.com', port: 465, secure: true,
      auth: { user: 'noreply@example.com', pass: 'test-only-password' },
    });
    expect(info.envelope).toEqual({ from: 'noreply@example.com', to: ['member@example.com'] });
    const message = info.message.toString('utf8');
    expect(message).toContain(`Subject: ${subject}`);
    expect(message).toContain('Content-Type: multipart/alternative');
    expect(message).toContain('Content-Type: text/plain');
    expect(message).toContain('Content-Type: text/html');
    expect(message.replace(/=\r?\n/g, '')).toContain('test-token');
  });

  test('keeps a quoted reply-to address separate from the support delivery envelope', async () => {
    const info = await sendMail({
      to: 'support@example.com', replyTo: { name: 'Ada, Frontend', address: 'ada@example.com' },
      subject: 'Support request', text: 'Please help with this exercise.',
    });
    expect(info.envelope).toEqual({ from: 'noreply@example.com', to: ['support@example.com'] });
    expect(info.message.toString('utf8')).toContain('Reply-To: "Ada, Frontend" <ada@example.com>');
  });

  test('fails before creating a transport when SMTP credentials are missing', async () => {
    delete process.env.SMTP_PASS;
    await expect(sendMail({ to: 'support@example.com', text: 'Test' }))
      .rejects.toMatchObject({ code: 'SMTP_NOT_CONFIGURED' });
    expect(transportSpy).not.toHaveBeenCalled();
  });
});
