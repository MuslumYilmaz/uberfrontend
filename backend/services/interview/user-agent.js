'use strict';

const ANDROID_TOKEN = 'android';
const MOBILE_TOKEN = 'mobile';
const PHONE_TOKENS = ['iphone', 'ipod', 'windows phone'];

function isPhoneUserAgent(value) {
  const userAgent = String(value || '').toLowerCase();

  if (PHONE_TOKENS.some((token) => userAgent.includes(token))) {
    return true;
  }

  const androidIndex = userAgent.indexOf(ANDROID_TOKEN);
  if (androidIndex === -1) return false;

  // Match Android phone UAs while keeping Android tablets (without "Mobile")
  // eligible. Starting one character after "android" preserves the prior
  // requirement that the two tokens are separated.
  return userAgent.indexOf(
    MOBILE_TOKEN,
    androidIndex + ANDROID_TOKEN.length + 1
  ) !== -1;
}

module.exports = { isPhoneUserAgent };
