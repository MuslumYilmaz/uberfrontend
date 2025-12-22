export const CONSOLE_ERROR_ALLOWLIST: RegExp[] = [
  // Common Chromium noise (often triggered by Monaco / complex layouts)
  /ResizeObserver loop limit exceeded/i,
  /ResizeObserver loop completed with undelivered notifications/i,
];

