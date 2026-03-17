function normalizeSameSite(value) {
  const raw = String(value || 'lax').trim().toLowerCase();
  if (raw === 'strict' || raw === 'none' || raw === 'lax') return raw;
  return 'lax';
}

function normalizeBoolean(value, fallback = false) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function getSiteKey(origin) {
  try {
    const hostname = new URL(String(origin || '')).hostname.replace(/^www\./, '');
    if (!hostname) return '';
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname;
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length < 2) return hostname;
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

function getCrossSiteOrigins(serverBase, frontendOrigins) {
  const serverSite = getSiteKey(serverBase);
  if (!serverSite) return [];
  return frontendOrigins.filter((origin) => {
    const frontendSite = getSiteKey(origin);
    return frontendSite && frontendSite !== serverSite;
  });
}

function validateAuthRuntimeConfig({
  serverBase,
  frontendOrigins,
  cookieSameSite,
  cookieSecure,
  cookieDomain,
  isProdRuntime,
}) {
  const sameSite = normalizeSameSite(cookieSameSite);
  const secure = normalizeBoolean(cookieSecure, Boolean(isProdRuntime));
  const frontend = Array.isArray(frontendOrigins) ? frontendOrigins.filter(Boolean) : [];
  const errors = [];
  const warnings = [];

  if (!serverBase) {
    errors.push('SERVER_BASE must be configured for auth cookie and OAuth flows.');
  }

  if (!frontend.length) {
    errors.push('At least one FRONTEND_ORIGIN/FRONTEND_ORIGINS entry is required for auth cookie delivery.');
  }

  if (sameSite === 'none' && !secure) {
    errors.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
  }

  if (frontend.length && sameSite !== 'none') {
    const crossSiteOrigins = getCrossSiteOrigins(serverBase, frontend);
    if (crossSiteOrigins.length === frontend.length) {
      errors.push('Cross-site frontend origins require COOKIE_SAMESITE=none for cookie auth.');
    } else if (crossSiteOrigins.length > 0) {
      warnings.push('Some configured frontend origins are cross-site and will not receive auth cookies unless COOKIE_SAMESITE=none.');
    }
  }

  const domain = String(cookieDomain || '').trim();
  if (domain && /localhost$/i.test(domain)) {
    warnings.push('COOKIE_DOMAIN should usually be omitted for localhost environments.');
  }

  return { errors, warnings, sameSite, secure };
}

module.exports = {
  validateAuthRuntimeConfig,
};
