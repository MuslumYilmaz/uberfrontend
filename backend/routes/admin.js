const router = require('express').Router();
const User = require('../models/User');

// GET /api/admin/users
router.get('/users', async (_req, res) => {
    try {
        const users = await User.find().select('-passwordHash').lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
    try {
        const allowed = [
            'username',
            'email',
            'bio',
            'avatarUrl',
            'role',
            'accessTier',
            'prefs',
            'stats',
            'billing',
            'coupons',
            'solvedQuestionIds',
        ];

        const update = {};
        for (const key of allowed) {
            if (key in req.body) update[key] = req.body[key];
        }

        const user = await User.findByIdAndUpdate(req.params.id, update, {
            new: true,
        }).select('-passwordHash');

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
