const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function getBearerToken(req) {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : null;
}

function requireAuth(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) return res.status(401).json({ error: 'Missing token' });
        const payload = jwt.verify(token, JWT_SECRET);
        req.auth = { userId: payload.sub, role: payload.role || 'user' };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth, getBearerToken };
