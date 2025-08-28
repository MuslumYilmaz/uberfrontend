// server/routes/activity.js
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityEvent = require('../models/ActivityEvent');
const XpCredit = require('../models/XpCredit'); // ⬅ NEW
const { requireAuth } = require('../middleware/Auth');

function utcDayStr(d = new Date()) {
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
function dayDiffUTC(aStr, bStr) {
    if (!aStr || !bStr) return Infinity;
    const a = new Date(aStr + 'T00:00:00.000Z').getTime();
    const b = new Date(bStr + 'T00:00:00.000Z').getTime();
    return Math.round((b - a) / 86400000);
}

/**
 * POST /api/activity/complete
 * body: { kind, tech, itemId?, source?, durationMin?, xp? }
 *
 * Behavior:
 * - Always log an ActivityEvent.
 * - XP is credited only once per (user, dayUTC, kind). Subsequent events that day set xp=0.
 */
router.post('/complete', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { kind, tech, itemId, source = 'tech', durationMin = 0, xp = 0 } = req.body || {};
        if (!kind || !tech) return res.status(400).json({ error: 'Missing kind or tech' });
        if (!['coding', 'trivia', 'debug'].includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
        if (!['javascript', 'angular'].includes(tech)) return res.status(400).json({ error: 'Invalid tech' });

        const completedAt = new Date();
        const dayUTC = utcDayStr(completedAt);

        // 1) Determine if this action should grant XP (first-of-day per kind)
        let credited = false;
        try {
            await XpCredit.create({ userId: String(user._id), dayUTC, kind });
            credited = true; // first credit wins
        } catch (e) {
            if (!(e && e.code === 11000)) throw e; // duplicate key => already credited today; otherwise rethrow
        }

        const xpAwarded = credited ? (Number(xp) || 0) : 0;
        const safeDuration = Math.max(1, Number(durationMin) || 1);

        // 2) Always log the event; make sure xp reflects XP actually awarded
        const event = await ActivityEvent.create({
            userId: user._id,
            kind,
            tech,
            itemId,
            source,
            durationMin: safeDuration,
            xp: xpAwarded,           // <-- store awarded XP for accurate heatmap/analytics
            completedAt,
            dayUTC,
        });

        // 3) Update aggregates
        user.stats = user.stats || {};
        // xpTotal only increases on credited events
        user.stats.xpTotal = (user.stats.xpTotal || 0) + xpAwarded;
        // completed counters track attempts/successes (keep as before)
        user.stats.completedTotal = (user.stats.completedTotal || 0) + 1;

        user.stats.perTech = user.stats.perTech || {};
        user.stats.perTech[tech] = user.stats.perTech[tech] || { xp: 0, completed: 0 };
        user.stats.perTech[tech].xp += xpAwarded;
        user.stats.perTech[tech].completed += 1;

        // streak (activity counts even if no XP credited; same-day diff=0 leaves streak unchanged)
        user.stats.streak = user.stats.streak || { current: 0, longest: 0, lastActiveUTCDate: null };
        const last = user.stats.streak.lastActiveUTCDate;
        const diff = dayDiffUTC(last, dayUTC);
        if (diff === 1) user.stats.streak.current = (user.stats.streak.current || 0) + 1;
        else if (diff !== 0) user.stats.streak.current = 1;
        user.stats.streak.longest = Math.max(user.stats.streak.longest || 0, user.stats.streak.current || 0);
        user.stats.streak.lastActiveUTCDate = dayUTC;

        await user.save();

        const recent = await ActivityEvent.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10).lean();
        res.json({ credited, stats: user.stats, event, recent });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/recent?limit=20&since=YYYY-MM-DD */
router.get('/recent', requireAuth, async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
        const since = req.query.since; // optional 'YYYY-MM-DD'
        const match = { userId: req.auth.userId };

        if (since) {
            // ignore bad dates silently (frontend passes YYYY-MM-DD)
            const sinceDate = new Date(`${since}T00:00:00.000Z`);
            if (!isNaN(sinceDate.getTime())) {
                match.completedAt = { $gte: sinceDate };
            }
        }

        const recent = await ActivityEvent.find(match).sort({ completedAt: -1 }).limit(limit).lean();
        res.json(recent);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/summary */
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId).select('stats');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const today = utcDayStr();
        const todayCompleted = await ActivityEvent.countDocuments({ userId: req.auth.userId, dayUTC: today });

        const dailyTarget = parseInt(process.env.DAILY_TARGET || '1', 10);
        const totalXp = user.stats?.xpTotal ?? 0;
        const current = user.stats?.streak?.current ?? 0;
        const best = user.stats?.streak?.longest ?? 0;

        res.json({
            totalXp,
            streak: { current, best },
            today: {
                completed: todayCompleted,
                total: dailyTarget,
                progress: Math.min(1, dailyTarget ? todayCompleted / dailyTarget : 1),
            },
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/heatmap?days=180 */
router.get('/heatmap', requireAuth, async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days || '180', 10), 1), 366);
        const end = new Date();
        const start = new Date(end.getTime() - (days - 1) * 86400000);
        const startStr = utcDayStr(start);
        const endStr = utcDayStr(end);

        const rows = await ActivityEvent.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.auth.userId),
                    dayUTC: { $gte: startStr, $lte: endStr },
                },
            },
            { $group: { _id: '$dayUTC', completed: { $sum: 1 }, xp: { $sum: '$xp' } } },
        ]);

        const map = Object.fromEntries(rows.map((r) => [r._id, { completed: r.completed, xp: r.xp }]));
        const data = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(end.getTime() - i * 86400000);
            const key = utcDayStr(d);
            const v = map[key] || { completed: 0, xp: 0 };
            data.push({ dayUTC: key, ...v });
        }
        data.reverse();
        res.json({ days, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;