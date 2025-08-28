// server/routes/activity.js
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityEvent = require('../models/ActivityEvent');
const XpCredit = require('../models/XpCredit');
const { requireAuth } = require('../middleware/Auth');

// ---------- date helpers ----------
function utcDayStr(d = new Date()) {
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
function dayDiffUTC(aStr, bStr) {
    if (!aStr || !bStr) return Infinity;
    const a = new Date(aStr + 'T00:00:00.000Z').getTime();
    const b = new Date(bStr + 'T00:00:00.000Z').getTime();
    return Math.round((b - a) / 86400000);
}

// ---------- leveling helpers (simple exponential growth) ----------
function nextStepForLevel(level) {
    // XP needed to go from (level) -> (level+1). L1->L2=100, grows 25%/level.
    return Math.round(100 * Math.pow(1.25, Math.max(0, level - 1)));
}
function computeLevelFromXp(totalXp) {
    let lvl = 1;
    let xpLeft = Math.max(0, Number(totalXp) || 0);

    while (true) {
        const step = nextStepForLevel(lvl);
        if (xpLeft < step) {
            const current = xpLeft;
            const needed = step;
            const pct = needed > 0 ? current / needed : 1;
            return {
                level: lvl,
                nextLevelXp: step,
                levelProgress: { current, needed, pct },
            };
        }
        xpLeft -= step;
        lvl += 1;
        if (lvl > 500) break; // hard safety cap
    }
    return { level: 500, nextLevelXp: nextStepForLevel(500), levelProgress: { current: 0, needed: nextStepForLevel(500), pct: 0 } };
}

/**
 * POST /api/activity/complete
 * body: { kind, tech, itemId?, source?, durationMin?, xp? }
 * - Logs an ActivityEvent
 * - Awards XP only once per (userId, dayUTC, kind) via XpCredit
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

        // Award XP once per (userId, dayUTC, kind)
        let awardedXp = 0;
        try {
            await XpCredit.create({ userId: String(user._id), dayUTC, kind });
            awardedXp = Number(xp) || 0;
        } catch (e) {
            // Duplicate credit => 0 XP; keep logging the event
            if (!(e && e.code === 11000)) throw e;
            awardedXp = 0;
        }

        // Log event (with awardedXp — may be 0 on repeats)
        const event = await ActivityEvent.create({
            userId: user._id,
            kind,
            tech,
            itemId,
            source,
            durationMin,
            xp: awardedXp,
            completedAt,
            dayUTC,
        });

        // Update aggregates
        user.stats = user.stats || {};
        user.stats.xpTotal = (user.stats.xpTotal || 0) + awardedXp;
        user.stats.completedTotal = (user.stats.completedTotal || 0) + 1;

        user.stats.perTech = user.stats.perTech || {};
        user.stats.perTech[tech] = user.stats.perTech[tech] || { xp: 0, completed: 0 };
        user.stats.perTech[tech].xp += awardedXp;
        user.stats.perTech[tech].completed += 1;

        // Streak (UTC)
        user.stats.streak = user.stats.streak || { current: 0, longest: 0, lastActiveUTCDate: null };
        const last = user.stats.streak.lastActiveUTCDate;
        const diff = dayDiffUTC(last, dayUTC);
        if (diff === 1) user.stats.streak.current = (user.stats.streak.current || 0) + 1;
        else if (diff !== 0) user.stats.streak.current = 1;
        user.stats.streak.longest = Math.max(user.stats.streak.longest || 0, user.stats.streak.current || 0);
        user.stats.streak.lastActiveUTCDate = dayUTC;

        await user.save();

        const recent = await ActivityEvent.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10).lean();
        res.json({ stats: user.stats, event, recent });
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

/** GET /api/activity/summary  (credit-based Today/Weekly + leveling) */
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId).select('stats');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const totalXp = user.stats?.xpTotal ?? 0;

        // Level from total XP
        const { level, nextLevelXp, levelProgress } = computeLevelFromXp(totalXp);

        // Streaks
        const current = user.stats?.streak?.current ?? 0;
        const best = user.stats?.streak?.longest ?? user.stats?.streak?.best ?? 0;

        // Freeze tokens (optional, defaults 0)
        const freezeTokens = Number(user.stats?.freezeTokens ?? 0);

        // Today credits (0..3)
        const todayStr = utcDayStr();
        const todayCompleted = await XpCredit.countDocuments({
            userId: String(req.auth.userId),
            dayUTC: todayStr,
        });
        const todayTotal = 3; // coding + trivia + debug
        const todayProgress = Math.min(1, todayTotal ? todayCompleted / todayTotal : 1);

        // Weekly credits (last 7 days, inclusive)
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - 6); // 6 days back + today = 7
        const startStr = utcDayStr(start);
        const weeklyCompleted = await XpCredit.countDocuments({
            userId: String(req.auth.userId),
            dayUTC: { $gte: startStr, $lte: todayStr },
        });
        const weeklyTarget = parseInt(process.env.WEEKLY_TARGET || '5', 10);
        const weeklyProgress = weeklyTarget > 0 ? Math.min(1, weeklyCompleted / weeklyTarget) : 1;

        res.json({
            totalXp,
            level,
            nextLevelXp,
            levelProgress,                 // { current, needed, pct }
            freezeTokens,
            streak: { current, best },
            weekly: {
                completed: weeklyCompleted,
                target: weeklyTarget,
                progress: weeklyProgress,
            },
            today: {
                completed: todayCompleted,
                total: todayTotal,
                progress: todayProgress,
            },
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/heatmap?days=180 (unchanged) */
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