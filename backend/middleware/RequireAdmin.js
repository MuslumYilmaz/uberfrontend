function requireAdmin(req, res, next) {
    const role = req.auth?.role || 'user';
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
}

module.exports = { requireAdmin };
