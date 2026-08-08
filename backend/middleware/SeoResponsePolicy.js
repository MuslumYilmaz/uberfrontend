'use strict';

function applySeoPrivateResponsePolicy(res) {
  res.set('Cache-Control', 'private, no-store, max-age=0');
  res.set('X-Robots-Tag', 'noindex, nofollow');
}

function requireSeoPrivateResponsePolicy(_req, res, next) {
  applySeoPrivateResponsePolicy(res);
  return next();
}

module.exports = {
  applySeoPrivateResponsePolicy,
  requireSeoPrivateResponsePolicy,
};
