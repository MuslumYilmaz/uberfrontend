'use strict';

const INTERVIEW_BASE_PATH = '/api/interviews';

function pathnameFrom(value) {
  let raw = String(value || '').trim();
  if (!raw) return '/';
  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).pathname || '/';
  } catch {
    return '/';
  }
  const interviewOffset = raw.toLowerCase().indexOf(INTERVIEW_BASE_PATH);
  if (interviewOffset >= 0) {
    raw = `${INTERVIEW_BASE_PATH}${raw.slice(interviewOffset + INTERVIEW_BASE_PATH.length)}`;
  }
  return (raw.split('?')[0].split('#')[0] || '/').replace(/\/{2,}/g, '/');
}

function normalizeInterviewPath(value) {
  const pathname = pathnameFrom(value);
  const normalized = pathname.toLowerCase();
  if (normalized === INTERVIEW_BASE_PATH || normalized.startsWith(`${INTERVIEW_BASE_PATH}/`)) {
    return pathname;
  }
  if (pathname === '/') return INTERVIEW_BASE_PATH;
  return `${INTERVIEW_BASE_PATH}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function isInterviewPath(value) {
  const pathname = pathnameFrom(value).toLowerCase();
  return pathname === INTERVIEW_BASE_PATH || pathname.startsWith(`${INTERVIEW_BASE_PATH}/`);
}

// HTTP middleware must only exempt requests whose actual pathname is mounted
// below /api/interviews. Telemetry inputs may include transaction prefixes
// (for example "POST /api/interviews/..."), so keep this stricter predicate
// separate from isInterviewPath rather than letting an embedded substring
// bypass the global API guards.
function isInterviewHttpPath(value) {
  let raw = String(value || '').trim();
  if (!raw) return false;
  try {
    if (/^https?:\/\//i.test(raw)) raw = new URL(raw).pathname || '/';
  } catch {
    return false;
  }
  // Do not collapse repeated slashes here: Express does not treat
  // //api/interviews as the /api/interviews mount, so exempting that value
  // would let it bypass both the outer Interview and global API limiters.
  const pathname = raw.split('?')[0].split('#')[0] || '/';
  const normalized = pathname.toLowerCase();
  return normalized === INTERVIEW_BASE_PATH || normalized.startsWith(`${INTERVIEW_BASE_PATH}/`);
}

function interviewPathContract(value) {
  const pathname = normalizeInterviewPath(value);
  const suffix = pathname.slice(INTERVIEW_BASE_PATH.length) || '/';
  const normalizedSuffix = suffix.toLowerCase();

  if (normalizedSuffix === '/') return INTERVIEW_BASE_PATH;
  if (['/config', '/availability', '/active'].includes(normalizedSuffix)) {
    return `${INTERVIEW_BASE_PATH}${normalizedSuffix}`;
  }
  if (/^\/[^/]+\/technical-void$/.test(normalizedSuffix)) {
    return `${INTERVIEW_BASE_PATH}/:sessionId/technical-void`;
  }
  if (/^\/[^/]+\/(?:results|control|end|abandon)$/.test(normalizedSuffix)) {
    const action = normalizedSuffix.split('/').pop();
    return `${INTERVIEW_BASE_PATH}/:sessionId/${action}`;
  }
  if (/^\/[^/]+\/mcq\/submit$/.test(normalizedSuffix)) {
    return `${INTERVIEW_BASE_PATH}/:sessionId/mcq/submit`;
  }
  if (/^\/[^/]+\/mcq\/[^/]+$/.test(normalizedSuffix)) {
    return `${INTERVIEW_BASE_PATH}/:sessionId/mcq/:questionId`;
  }
  if (/^\/[^/]+\/coding\/(?:start|draft|check-runs|submit)$/.test(normalizedSuffix)) {
    const action = normalizedSuffix.split('/').pop();
    return `${INTERVIEW_BASE_PATH}/:sessionId/coding/${action}`;
  }
  if (/^\/[^/]+\/system-design\/(?:draft|submit)$/.test(normalizedSuffix)) {
    const action = normalizedSuffix.split('/').pop();
    return `${INTERVIEW_BASE_PATH}/:sessionId/system-design/${action}`;
  }
  if (/^\/[^/]+\/system-design\/twist\/reveal$/.test(normalizedSuffix)) {
    return `${INTERVIEW_BASE_PATH}/:sessionId/system-design/twist/reveal`;
  }
  if (/^\/[^/]+$/.test(normalizedSuffix)) return `${INTERVIEW_BASE_PATH}/:sessionId`;
  return `${INTERVIEW_BASE_PATH}/[redacted]`;
}

function interviewOperation(value, methodRaw = 'GET') {
  const method = String(methodRaw || 'GET').trim().toUpperCase();
  const contract = interviewPathContract(value);
  if (contract.endsWith('/config') || contract.endsWith('/availability')) return 'availability';
  if (contract.endsWith('/active')) return 'active-resume';
  if (contract === INTERVIEW_BASE_PATH && method === 'POST') return 'create';
  if (contract.endsWith('/technical-void')) return 'technical-void';
  if (contract.endsWith('/results')) return 'results';
  if (contract.endsWith('/control')) return 'control';
  if (contract.endsWith('/mcq/:questionId') && method === 'PUT') return 'mcq-answer';
  if (contract.endsWith('/mcq/submit')) return 'mcq-submit';
  if (contract.endsWith('/coding/start')) return 'coding-start';
  if (contract.endsWith('/coding/draft')) return 'coding-draft';
  if (contract.endsWith('/coding/check-runs')) return 'coding-check';
  if (contract.endsWith('/coding/submit')) return 'coding-submit';
  if (contract.endsWith('/system-design/draft')) return 'system-design-draft';
  if (contract.endsWith('/system-design/twist/reveal')) return 'system-design-twist';
  if (contract.endsWith('/system-design/submit')) return 'system-design-submit';
  if (contract.endsWith('/end') || contract.endsWith('/abandon')) return 'abandon';
  if (contract.endsWith('/:sessionId') && method === 'GET') return 'session-resume';
  return 'unknown';
}

module.exports = {
  INTERVIEW_BASE_PATH,
  interviewOperation,
  interviewPathContract,
  isInterviewHttpPath,
  isInterviewPath,
  pathnameFrom,
};
