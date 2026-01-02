const app = require('../index');

// Vercel passes the full incoming path in some runtimes and strips `/api` in others.
// Normalize so our existing Express routes (which are prefixed with `/api`) keep working.
module.exports = (req, res) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
};

