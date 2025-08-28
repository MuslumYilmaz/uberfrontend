// server/routes/activity.js
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityEvent = require('../models/ActivityEvent');
const XpCredit = require('../models/XpCredit');
const { requireAuth } = require('../middleware/Auth');

// ---------- helpers ----------
function utcDayStr(d = new Date()) { return d.toISOString().slice(0, 10); }
function dayDiffUTC(aStr, bStr) {
    if (!aStr || !bStr) return Infinity;
    const a = new Date(aStr + 'T00:00:00.000Z').getTime();
    const b = new Date(bStr + 'T00:00:00.000Z').getTime();
    return Math.round((b - a) / 86400000);
}
function startOfISOWeekUTC(d = new Date()) {
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = dt.getUTCDay(); // 0..6 (Sun..Sat)
    const diff = (day === 0 ? -6 : 1) - day; // move to Monday
    dt.setUTCDate(dt.getUTCDate() + diff);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
}
function addDaysUTC(d, days) {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
}
function isoWeekKey(d = new Date()) {
    // Use Monday date as the key: 'YYYY-MM-DD'
    return utcDayStr(startOfISOWeekUTC(d));
}
// Level curve: fast early, slower later. Adjust constants as you like.
function levelFromXp(totalXp) {
    const xp = Math.max(0, Number(totalXp) || 0);
    let level = 1;
    const levelXp = n => Math.floor(100 * Math.pow(n, 1.5));
    let next = levelXp(level);
    while (xp >= next && level < 999) {
        level += 1;
        next = levelXp(level);
    }
    const prevThreshold = level === 1 ? 0 : levelXp(level - 1);
    const current = xp - prevThreshold;
    const needed = next - prevThreshold;
    const pct = needed > 0 ? current / needed : 1;
    return { level, nextLevelXp: next, levelProgress: { current, needed, pct } };
}

// ---------- config ----------
const WEEKLY_TARGET = parseInt(process.env.WEEKLY_TARGET || '5', 10);

// ---------- routes ----------

/**
 * POST /api/activity/complete
 * body: { kind, tech, itemId?, source?, durationMin?, xp? }
 * Behavior:
 *  - Always log ActivityEvent.
 *  - XP credited only once per (user, dayUTC, kind). Others that day get xp=0.
 *  - Streak-freeze: if exactly 1 day gap (diff===2) and user has a freeze token, consume 1 and continue streak.
 *  - Weekly goal token: first time you reach WEEKLY_TARGET in the ISO week, grant +1 token.
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
            credited = true;
        } catch (e) {
            if (!(e && e.code === 11000)) throw e; // rethrow non-duplicate errors
        }

        const xpAwarded = credited ? (Number(xp) || 0) : 0;
        const safeDuration = Math.max(1, Number(durationMin) || 1);

        // 2) Always log the event; store awarded XP
        const event = await ActivityEvent.create({
            userId: user._id,
            kind,
            tech,
            itemId,
            source,
            durationMin: safeDuration,
            xp: xpAwarded,
            completedAt,
            dayUTC,
        });

        // 3) Aggregates + streak
        user.stats = user.stats || {};
        user.stats.xpTotal = (user.stats.xpTotal || 0) + xpAwarded;
        user.stats.completedTotal = (user.stats.completedTotal || 0) + 1;

        user.stats.perTech = user.stats.perTech || {};
        user.stats.perTech[tech] = user.stats.perTech[tech] || { xp: 0, completed: 0 };
        user.stats.perTech[tech].xp += xpAwarded;
        user.stats.perTech[tech].completed += 1;

        // streak & freeze
        user.stats.streak = user.stats.streak || { current: 0, longest: 0, lastActiveUTCDate: null };
        user.stats.freeze = user.stats.freeze || { tokens: 0, lastAwardWeekStart: null };

        const last = user.stats.streak.lastActiveUTCDate;
        const diff = dayDiffUTC(last, dayUTC);

        if (diff === 1) {
            user.stats.streak.current = (user.stats.streak.current || 0) + 1;
        } else if (diff === 2 && (user.stats.freeze.tokens || 0) > 0) {
            // consume one freeze token to bridge a single missed day
            user.stats.freeze.tokens = (user.stats.freeze.tokens || 0) - 1;
            user.stats.streak.current = (user.stats.streak.current || 0) + 1;
        } else if (diff !== 0) {
            user.stats.streak.current = 1; // new streak
        }
        user.stats.streak.longest = Math.max(user.stats.streak.longest || 0, user.stats.streak.current || 0);
        user.stats.streak.lastActiveUTCDate = dayUTC;

        // 4) Weekly goal token (once per ISO week)
        const weekStart = startOfISOWeekUTC(completedAt);
        const weekEnd = addDaysUTC(weekStart, 7);
        const weekKey = isoWeekKey(completedAt);

        const weeklyCompleted = await ActivityEvent.countDocuments({
            userId: user._id,
            completedAt: { $gte: weekStart, $lt: weekEnd },
        });

        if (
            weeklyCompleted >= WEEKLY_TARGET &&
            user.stats.freeze.lastAwardWeekStart !== weekKey
        ) {
            user.stats.freeze.tokens = (user.stats.freeze.tokens || 0) + 1;
            user.stats.freeze.lastAwardWeekStart = weekKey;
        }

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

        // weekly ring (ISO week)
        const now = new Date();
        const weekStart = startOfISOWeekUTC(now);
        const weekEnd = addDaysUTC(weekStart, 7);
        const weeklyCompleted = await ActivityEvent.countDocuments({
            userId: req.auth.userId,
            completedAt: { $gte: weekStart, $lt: weekEnd },
        });

        // levels
        const totalXp = user.stats?.xpTotal ?? 0;
        const { level, nextLevelXp, levelProgress } = levelFromXp(totalXp);

        const current = user.stats?.streak?.current ?? 0;
        const best = user.stats?.streak?.longest ?? 0;
        const freezeTokens = user.stats?.freeze?.tokens ?? 0;

        const dailyTarget = parseInt(process.env.DAILY_TARGET || '1', 10);
        const todayProgress = Math.min(1, dailyTarget ? todayCompleted / dailyTarget : 1);

        const weeklyTarget = WEEKLY_TARGET;
        const weeklyProgress = Math.min(1, weeklyTarget ? weeklyCompleted / weeklyTarget : 1);

        res.json({
            totalXp,
            level,
            nextLevelXp,
            levelProgress, // { current, needed, pct }
            streak: { current, best },
            freezeTokens,
            weekly: { completed: weeklyCompleted, target: weeklyTarget, progress: weeklyProgress },
            today: { completed: todayCompleted, total: dailyTarget, progress: todayProgress },
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
