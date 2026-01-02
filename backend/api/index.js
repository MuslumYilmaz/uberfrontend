const app = require('../app');

// Normalize so Express routes (prefixed with `/api`) keep working across runtimes.
module.exports = (req, res) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
};
