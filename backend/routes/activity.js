// server/routes/activity.js
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityEvent = require('../models/ActivityEvent');
const FirstCompletionCredit = require('../models/FirstCompletionCredit');
const XpCredit = require('../models/XpCredit');
const { requireAuth } = require('../middleware/Auth');
const { getQuestionMeta } = require('../services/gamification/question-catalog');
const {
    xpForCompletion,
    normalizeDifficulty,
    computeLevel,
    readWeeklyGoalSettings,
    readActiveActivityStreakCurrent,
} = require('../services/gamification/engine');
const { countWeeklySolvedUnique } = require('../services/gamification/dashboard');
const { currentWeekBounds } = require('../services/gamification/timezone');
const { awardWeeklyGoalBonusIfEligible } = require('../services/gamification/weekly-goal');

const VALID_TECHS = ['javascript', 'angular', 'react', 'vue', 'html', 'css', 'system-design'];
const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 200;
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

function createHttpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function isTransactionUnsupportedError(error) {
    const msg = String(error?.message || '').toLowerCase();
    return (
        msg.includes('transaction numbers are only allowed on a replica set member') ||
        msg.includes('this mongodb deployment does not support retryable writes') ||
        (msg.includes('transaction') && msg.includes('replica set'))
    );
}

/**
 * POST /api/activity/complete
 * body: { kind, tech, itemId?, source?, durationMin?, xp? }
 * - Logs an ActivityEvent
 * - Awards XP only once per (userId, kind, itemId) via FirstCompletionCredit
 * - Persists event + aggregates transactionally when transactions are available
 */
router.post('/complete', requireAuth, async (req, res) => {
    try {
        const { kind, tech, itemId, source = 'tech', durationMin = 0, difficulty } = req.body || {};
        if (!kind || !tech) return res.status(400).json({ error: 'Missing kind or tech' });
        if (!['coding', 'trivia', 'debug'].includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
        if (!VALID_TECHS.includes(tech)) return res.status(400).json({ error: 'Invalid tech' });

        const durationMinSafe = Math.min(Math.max(Number(durationMin) || 0, 0), 24 * 60);
        const questionMeta = getQuestionMeta({ kind, itemId: String(itemId || '') });
        const resolvedDifficulty = normalizeDifficulty(
            difficulty
            || questionMeta?.difficulty
            || 'intermediate'
        );

        const completedAt = new Date();
        const dayUTC = utcDayStr(completedAt);
        const itemIdText = typeof itemId === 'string' ? itemId.trim() : '';

        const runCompletion = async (session = null) => {
            const userQuery = User.findById(req.auth.userId);
            if (session) userQuery.session(session);
            const user = await userQuery;
            if (!user) throw createHttpError(404, 'User not found');

            const prevLevel = computeLevel(user.stats?.xpTotal || 0).level;

            // Legacy daily credit record (kept for old summary widgets).
            try {
                const legacyCredit = { userId: String(user._id), dayUTC, kind };
                if (session) {
                    await XpCredit.create([legacyCredit], { session });
                } else {
                    await XpCredit.create(legacyCredit);
                }
            } catch (e) {
                if (!(e && e.code === 11000)) throw e;
            }

            // Award XP atomically on first solve per (user + kind + itemId).
            let awardedXp = 0;
            if (itemIdText) {
                const firstCreditResult = await FirstCompletionCredit.updateOne(
                    { userId: user._id, kind, itemId: itemIdText },
                    { $setOnInsert: { userId: user._id, kind, itemId: itemIdText, firstCompletedAt: completedAt } },
                    session ? { upsert: true, session } : { upsert: true }
                );
                if ((firstCreditResult?.upsertedCount || 0) > 0) {
                    awardedXp = xpForCompletion({ kind, difficulty: resolvedDifficulty });
                }
            }

            // Log event (with awardedXp — may be 0 on repeats)
            const eventDoc = {
                userId: user._id,
                kind,
                tech,
                itemId: itemIdText || undefined,
                source,
                durationMin: durationMinSafe,
                xp: awardedXp,
                completedAt,
                dayUTC,
            };
            let event;
            if (session) {
                [event] = await ActivityEvent.create([eventDoc], { session });
            } else {
                event = await ActivityEvent.create(eventDoc);
            }

            // Build updated stats in-memory first (needed for streak + weekly bonus logic).
            user.stats = user.stats || {};
            user.stats.xpTotal = (user.stats.xpTotal || 0) + awardedXp;
            user.stats.completedTotal = (user.stats.completedTotal || 0) + 1;

            // Streak (UTC)
            user.stats.streak = user.stats.streak || { current: 0, longest: 0, lastActiveUTCDate: null };
            const last = user.stats.streak.lastActiveUTCDate;
            const diff = dayDiffUTC(last, dayUTC);
            if (diff === 1) user.stats.streak.current = (user.stats.streak.current || 0) + 1;
            else if (diff !== 0) user.stats.streak.current = 1;
            user.stats.streak.longest = Math.max(user.stats.streak.longest || 0, user.stats.streak.current || 0);
            user.stats.streak.lastActiveUTCDate = dayUTC;

            const weekly = await awardWeeklyGoalBonusIfEligible(user, session ? { session } : {});
            const totalXpIncrement = awardedXp + weekly.bonusXp;

            const aggregateUpdate = {
                $inc: {
                    'stats.xpTotal': totalXpIncrement,
                    'stats.completedTotal': 1,
                    [`stats.perTech.${tech}.xp`]: awardedXp,
                    [`stats.perTech.${tech}.completed`]: 1,
                },
                $set: {
                    'stats.streak.current': user.stats.streak.current || 0,
                    'stats.streak.longest': user.stats.streak.longest || 0,
                    'stats.streak.lastActiveUTCDate': dayUTC,
                },
            };
            const aggregateUpdateQuery = User.updateOne({ _id: user._id }, aggregateUpdate);
            if (session) aggregateUpdateQuery.session(session);
            await aggregateUpdateQuery;

            const updatedUserQuery = User.findById(user._id).select('stats');
            if (session) updatedUserQuery.session(session);
            const updatedUser = await updatedUserQuery;
            if (!updatedUser) throw createHttpError(404, 'User not found');

            const nextLevel = computeLevel(updatedUser.stats?.xpTotal || 0).level;
            const levelUp = nextLevel > prevLevel;

            const recentQuery = ActivityEvent.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10);
            if (session) recentQuery.session(session);
            const recent = await recentQuery.lean();

            return {
                stats: updatedUser.stats,
                event,
                recent,
                xpAwarded: totalXpIncrement,
                levelUp,
                weeklyGoal: {
                    completed: weekly.weeklyCompleted,
                    target: weekly.settings.target,
                    reached: weekly.reached,
                    bonusGranted: weekly.awarded || weekly.bonusAlreadyGranted,
                },
            };
        };

        let payload = null;
        const txSession = await mongoose.startSession();
        try {
            try {
                await txSession.withTransaction(async () => {
                    payload = await runCompletion(txSession);
                });
            } catch (txErr) {
                if (!isTransactionUnsupportedError(txErr)) throw txErr;
                console.warn('[activity] Transactions are unavailable. Falling back to non-transactional completion.');
                payload = await runCompletion(null);
            }
        } finally {
            await txSession.endSession();
        }

        if (!payload) throw new Error('Activity completion failed without a result.');
        return res.json(payload);
    } catch (e) {
        if (e?.statusCode) return res.status(e.statusCode).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/recent?limit=20&since=YYYY-MM-DD (all=1/limit=0 => capped max) */
router.get('/recent', requireAuth, async (req, res) => {
    try {
        const wantsAll = req?.query?.limit === '0' || req?.query?.all === '1';
        const rawLimit = parseInt(
            wantsAll ? String(MAX_RECENT_LIMIT) : String(req.query.limit ?? DEFAULT_RECENT_LIMIT),
            10
        );
        const limit = Math.min(
            Math.max(Number.isNaN(rawLimit) ? DEFAULT_RECENT_LIMIT : rawLimit, 1),
            MAX_RECENT_LIMIT
        );
        const since = req.query.since; // optional 'YYYY-MM-DD'
        const match = { userId: req.auth.userId };

        if (since) {
            const sinceDate = new Date(`${since}T00:00:00.000Z`);
            if (!isNaN(sinceDate.getTime())) {
                match.completedAt = { $gte: sinceDate };
            }
        }

        const query = ActivityEvent.find(match).sort({ completedAt: -1 }).limit(limit);

        const recent = await query.lean();
        res.json(recent);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /api/activity/summary */
router.get('/summary', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.auth.userId).select('stats prefs');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const totalXp = user.stats?.xpTotal ?? 0;

        const xpLevel = computeLevel(totalXp);
        const levelProgress = {
            current: xpLevel.currentLevelXp,
            needed: xpLevel.levelStepXp,
            pct: xpLevel.progress,
        };

        const todayStr = utcDayStr();
        // Streaks
        const current = readActiveActivityStreakCurrent(user.stats?.streak, todayStr);
        const best = user.stats?.streak?.longest ?? user.stats?.streak?.best ?? 0;

        // Freeze tokens (optional, defaults 0)
        const freezeTokens = Number(user.stats?.freezeTokens ?? 0);

        // Today credits (0..3)
        const todayCompleted = await XpCredit.countDocuments({
            userId: String(req.auth.userId),
            dayUTC: todayStr,
        });
        const todayTotal = 3; // coding + trivia + debug
        const todayProgress = Math.min(1, todayTotal ? todayCompleted / todayTotal : 1);

        const weeklyGoalSettings = readWeeklyGoalSettings(user);
        const weekBounds = currentWeekBounds();
        const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds);
        const weeklyTarget = weeklyGoalSettings.target;
        const weeklyProgress = weeklyTarget > 0 ? Math.min(1, weeklyCompleted / weeklyTarget) : 1;

        res.json({
            totalXp,
            level: xpLevel.level,
            nextLevelXp: xpLevel.nextLevelXp,
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
