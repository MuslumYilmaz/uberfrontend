// server/routes/activity.js
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityEvent = require('../models/ActivityEvent');
const ActivityCompletion = require('../models/ActivityCompletion');
const ActivityCompletionRequest = require('../models/ActivityCompletionRequest');
const FirstCompletionCredit = require('../models/FirstCompletionCredit');
const WeeklyGoalBonusCredit = require('../models/WeeklyGoalBonusCredit');
const XpCredit = require('../models/XpCredit');
const DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
const { requireAuth } = require('../middleware/Auth');
const { getQuestionMeta } = require('../services/gamification/question-catalog');
const { getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge');
const {
    xpForCompletion,
    normalizeDifficulty,
    computeLevel,
    readActiveActivityStreakCurrent,
} = require('../services/gamification/engine');
const { countTodayCompletedKinds, countWeeklySolvedUnique } = require('../services/gamification/dashboard');
const { currentWeekBounds, dayKeyInTimezone, dayDiffByKey } = require('../services/gamification/timezone');
const { awardWeeklyGoalBonusIfEligible } = require('../services/gamification/weekly-goal');
const { ensureCurrentWeeklyGoalState } = require('../services/gamification/weekly-goal-state');
const { SOLVE_KINDS } = require('../services/gamification/constants');

const VALID_TECHS = ['javascript', 'angular', 'react', 'vue', 'html', 'css', 'system-design'];
const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 200;
// ---------- date helpers ----------
function utcDayStr(d = new Date()) {
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
function createHttpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function isDuplicateKeyError(error) {
    return Boolean(error && error.code === 11000);
}

function isTransactionUnsupportedError(error) {
    const msg = String(error?.message || '').toLowerCase();
    return (
        msg.includes('transaction numbers are only allowed on a replica set member') ||
        msg.includes('this mongodb deployment does not support retryable writes') ||
        (msg.includes('transaction') && msg.includes('replica set'))
    );
}

async function loadWeeklyGoalState(user, session = null) {
    const { settings, weekBounds } = await ensureCurrentWeeklyGoalState(user, { session });
    const weeklyCompleted = await countWeeklySolvedUnique(user._id, weekBounds, session ? { session } : {});
    const bonusQuery = WeeklyGoalBonusCredit.exists({
        userId: user._id,
        weekKey: weekBounds.weekKey,
    });
    if (session) bonusQuery.session(session);
    const bonusAlreadyGranted = await bonusQuery;

    return {
        settings,
        weekBounds,
        weeklyCompleted,
        reached: settings.enabled && weeklyCompleted >= settings.target,
        awarded: false,
        bonusXp: 0,
        bonusAlreadyGranted: Boolean(bonusAlreadyGranted),
    };
}

/**
 * POST /api/activity/complete
 * body: { kind, tech, itemId, requestId?, source?, durationMin?, xp? }
 * - Stores one logical completion per (userId, kind, itemId)
 * - Replays the same response for a known requestId when available
 * - Persists event + aggregates transactionally when transactions are available
 */
router.post('/complete', requireAuth, async (req, res) => {
    try {
        const { kind, tech, itemId, requestId, source = 'tech', durationMin = 0, difficulty } = req.body || {};
        if (!kind || !tech) return res.status(400).json({ error: 'Missing kind or tech' });
        if (!['coding', 'trivia', 'debug', 'incident'].includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
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
        const activityDayKey = dayKeyInTimezone(completedAt);
        const itemIdText = typeof itemId === 'string' ? itemId.trim() : '';
        const requestIdText = typeof requestId === 'string' ? requestId.trim() : '';
        if (!itemIdText) return res.status(400).json({ error: 'itemId is required' });

        const receiptQuery = requestIdText
            ? ActivityCompletionRequest.findOne({ userId: req.auth.userId, requestId: requestIdText }).lean()
            : null;
        const storedReceipt = receiptQuery ? await receiptQuery : null;
        if (storedReceipt?.response) {
            return res.json(storedReceipt.response);
        }

        const runCompletion = async (session = null) => {
            const userQuery = User.findById(req.auth.userId);
            if (session) userQuery.session(session);
            const user = await userQuery;
            if (!user) throw createHttpError(404, 'User not found');

            const prevLevel = computeLevel(user.stats?.xpTotal || 0).level;
            const completionFilter = { userId: user._id, kind, itemId: itemIdText };
            const shouldTrackSolvedQuestions = kind !== 'incident';
            let completion = null;
            let firstLogicalCompletion = false;
            let awardedXp = 0;

            const completionQuery = ActivityCompletion.findOne(completionFilter);
            if (session) completionQuery.session(session);
            completion = await completionQuery;

            if (!completion) {
                const legacyFirstQuery = FirstCompletionCredit.findOne(completionFilter);
                if (session) legacyFirstQuery.session(session);
                const legacyFirstCredit = await legacyFirstQuery;

                if (legacyFirstCredit) {
                    const legacyCompletedAt = legacyFirstCredit.firstCompletedAt || completedAt;
                    const legacyUpsert = ActivityCompletion.findOneAndUpdate(
                        completionFilter,
                        {
                            $setOnInsert: {
                                userId: user._id,
                                kind,
                                itemId: itemIdText,
                                tech,
                                source,
                                durationMin: durationMinSafe,
                                difficultySnapshot: resolvedDifficulty,
                                xpAwarded: 0,
                                completedAt: legacyCompletedAt,
                                dayUTC: utcDayStr(legacyCompletedAt),
                                active: true,
                                createdFromLegacyCredit: true,
                            },
                            $set: {
                                lastAttemptAt: completedAt,
                            },
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true, session }
                    );
                    completion = await legacyUpsert;
                } else {
                    awardedXp = xpForCompletion({ kind, difficulty: resolvedDifficulty });
                    try {
                        if (session) {
                            [completion] = await ActivityCompletion.create([{
                                userId: user._id,
                                kind,
                                itemId: itemIdText,
                                tech,
                                source,
                                durationMin: durationMinSafe,
                                difficultySnapshot: resolvedDifficulty,
                                xpAwarded: awardedXp,
                                completedAt,
                                dayUTC,
                                active: true,
                                lastAttemptAt: completedAt,
                            }], { session });
                        } else {
                            completion = await ActivityCompletion.create({
                                userId: user._id,
                                kind,
                                itemId: itemIdText,
                                tech,
                                source,
                                durationMin: durationMinSafe,
                                difficultySnapshot: resolvedDifficulty,
                                xpAwarded: awardedXp,
                                completedAt,
                                dayUTC,
                                active: true,
                                lastAttemptAt: completedAt,
                            });
                        }
                        firstLogicalCompletion = true;
                    } catch (error) {
                        if (!isDuplicateKeyError(error)) throw error;
                        const existingCompletionQuery = ActivityCompletion.findOne(completionFilter);
                        if (session) existingCompletionQuery.session(session);
                        completion = await existingCompletionQuery;
                        awardedXp = 0;
                    }
                }
            } else if (completion.active === false) {
                awardedXp = Number(completion.xpAwarded || xpForCompletion({ kind, difficulty: resolvedDifficulty }));
                const reactivationQuery = ActivityCompletion.findOneAndUpdate(
                    completionFilter,
                    {
                        $set: {
                            active: true,
                            tech,
                            source,
                            durationMin: durationMinSafe,
                            // Completion difficulty is a historical snapshot, not live catalog metadata.
                            difficultySnapshot: completion.difficultySnapshot || resolvedDifficulty,
                            completedAt,
                            dayUTC,
                            lastAttemptAt: completedAt,
                        },
                    },
                    { new: true, session }
                );
                completion = await reactivationQuery;
                firstLogicalCompletion = true;
            } else {
                const touchQuery = ActivityCompletion.updateOne(
                    completionFilter,
                    { $set: { lastAttemptAt: completedAt } },
                    session ? { session } : {}
                );
                if (session) touchQuery.session(session);
                await touchQuery;
            }

            if (firstLogicalCompletion && shouldTrackSolvedQuestions) {
                try {
                    const firstCredit = { userId: user._id, kind, itemId: itemIdText, firstCompletedAt: completedAt };
                    if (session) {
                        await FirstCompletionCredit.create([firstCredit], { session });
                    } else {
                        await FirstCompletionCredit.create(firstCredit);
                    }
                } catch (error) {
                    if (!isDuplicateKeyError(error)) throw error;
                }

                // Legacy daily credit record (kept for old summary widgets).
                try {
                    const legacyCredit = { userId: String(user._id), dayUTC, kind };
                    if (session) {
                        await XpCredit.create([legacyCredit], { session });
                    } else {
                        await XpCredit.create(legacyCredit);
                    }
                } catch (error) {
                    if (!isDuplicateKeyError(error)) throw error;
                }
            }

            let event = null;
            let weekly = null;
            if (firstLogicalCompletion) {
                const eventDoc = {
                    userId: user._id,
                    kind,
                    tech,
                    itemId: itemIdText,
                    source,
                    durationMin: durationMinSafe,
                    xp: awardedXp,
                    completedAt,
                    dayUTC,
                };
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
                const diff = dayDiffByKey(last, activityDayKey);
                if (diff === 1) user.stats.streak.current = (user.stats.streak.current || 0) + 1;
                else if (diff !== 0) user.stats.streak.current = 1;
                user.stats.streak.longest = Math.max(user.stats.streak.longest || 0, user.stats.streak.current || 0);
                user.stats.streak.lastActiveUTCDate = activityDayKey;

                weekly = await awardWeeklyGoalBonusIfEligible(user, session ? { session } : {});
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
                        'stats.streak.lastActiveUTCDate': activityDayKey,
                    },
                };
                if (shouldTrackSolvedQuestions) {
                    aggregateUpdate.$addToSet = { solvedQuestionIds: itemIdText };
                }
                const aggregateUpdateQuery = User.updateOne({ _id: user._id }, aggregateUpdate);
                if (session) aggregateUpdateQuery.session(session);
                await aggregateUpdateQuery;
            }

            const updatedUserQuery = User.findById(user._id).select('stats solvedQuestionIds');
            if (session) updatedUserQuery.session(session);
            const updatedUser = await updatedUserQuery;
            if (!updatedUser) throw createHttpError(404, 'User not found');

            if (!weekly) {
                weekly = await loadWeeklyGoalState(updatedUser, session);
            }

            const nextLevel = computeLevel(updatedUser.stats?.xpTotal || 0).level;
            const levelUp = firstLogicalCompletion && nextLevel > prevLevel;

            const recentQuery = ActivityEvent.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10);
            if (session) recentQuery.session(session);
            const recent = await recentQuery.lean();

            return {
                stats: updatedUser.stats,
                solvedQuestionIds: Array.isArray(updatedUser.solvedQuestionIds) ? updatedUser.solvedQuestionIds : [],
                event: event?.toObject ? event.toObject() : event,
                recent,
                xpAwarded: firstLogicalCompletion ? awardedXp + weekly.bonusXp : 0,
                levelUp,
                logicalCompletionCreated: firstLogicalCompletion,
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
        if (requestIdText) {
            try {
                const receiptPayload = {
                    userId: req.auth.userId,
                    requestId: requestIdText,
                    kind,
                    tech,
                    itemId: itemIdText,
                    action: 'complete',
                    response: payload,
                };
                await ActivityCompletionRequest.updateOne(
                    { userId: req.auth.userId, requestId: requestIdText },
                    { $setOnInsert: receiptPayload },
                    { upsert: true }
                );
            } catch (error) {
                if (!isDuplicateKeyError(error)) throw error;
            }
        }
        return res.json(payload);
    } catch (e) {
        if (e?.statusCode) return res.status(e.statusCode).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/activity/uncomplete
 * body: { kind, tech, itemId }
 * - Deactivates a logical completion
 * - Rolls back solved state, xp/level, per-tech aggregates, weekly bonus, and current daily completion
 * - Preserves historical activity streak/event history
 */
router.post('/uncomplete', requireAuth, async (req, res) => {
    try {
        const { kind, tech, itemId } = req.body || {};
        if (!kind || !tech) return res.status(400).json({ error: 'Missing kind or tech' });
        if (!['coding', 'trivia', 'debug'].includes(kind)) return res.status(400).json({ error: 'Invalid kind' });
        if (!VALID_TECHS.includes(tech)) return res.status(400).json({ error: 'Invalid tech' });

        const itemIdText = typeof itemId === 'string' ? itemId.trim() : '';
        if (!itemIdText) return res.status(400).json({ error: 'itemId is required' });

        const runRollback = async (session = null) => {
            const userQuery = User.findById(req.auth.userId).select('stats solvedQuestionIds prefs');
            if (session) userQuery.session(session);
            const user = await userQuery;
            if (!user) throw createHttpError(404, 'User not found');

            const prevLevel = computeLevel(user.stats?.xpTotal || 0).level;
            const completionFilter = { userId: user._id, kind, itemId: itemIdText };
            const completionQuery = ActivityCompletion.findOne(completionFilter);
            if (session) completionQuery.session(session);
            const completion = await completionQuery;

            let xpRemoved = 0;
            let rollbackApplied = false;
            let bonusRevoked = false;
            let dailyChallengeRevoked = false;

            if (completion?.active) {
                rollbackApplied = true;
                xpRemoved = Number(completion.xpAwarded || 0);

                const deactivateQuery = ActivityCompletion.updateOne(
                    completionFilter,
                    { $set: { active: false, deactivatedAt: new Date() } },
                    session ? { session } : {}
                );
                if (session) deactivateQuery.session(session);
                await deactivateQuery;

                const rollbackQuery = User.updateOne(
                    { _id: user._id },
                    {
                        $inc: {
                            'stats.xpTotal': -xpRemoved,
                            'stats.completedTotal': -1,
                            [`stats.perTech.${completion.tech}.xp`]: -xpRemoved,
                            [`stats.perTech.${completion.tech}.completed`]: -1,
                        },
                        $pull: {
                            solvedQuestionIds: itemIdText,
                        },
                    },
                    session ? { session } : {}
                );
                if (session) rollbackQuery.session(session);
                await rollbackQuery;

                const currentDailyChallenge = await getOrCreateDailyChallenge({ user });
                if (currentDailyChallenge?.questionId === itemIdText) {
                    const deleteDailyQuery = DailyChallengeCompletion.findOneAndDelete({
                        userId: user._id,
                        dayKey: currentDailyChallenge.dayKey,
                    });
                    if (session) deleteDailyQuery.session(session);
                    const deletedDaily = await deleteDailyQuery;
                    dailyChallengeRevoked = Boolean(deletedDaily);
                }

                const weeklyAfterBase = await loadWeeklyGoalState(user, session);
                if (!weeklyAfterBase.reached) {
                    const revokeBonusQuery = WeeklyGoalBonusCredit.findOneAndDelete({
                        userId: user._id,
                        weekKey: weeklyAfterBase.weekBounds.weekKey,
                    });
                    if (session) revokeBonusQuery.session(session);
                    const removedBonus = await revokeBonusQuery;
                    if (removedBonus) {
                        bonusRevoked = true;
                        const bonusXp = Number(removedBonus.xp || 0);
                        xpRemoved += bonusXp;

                        const bonusRollbackQuery = User.updateOne(
                            { _id: user._id },
                            { $inc: { 'stats.xpTotal': -bonusXp } },
                            session ? { session } : {}
                        );
                        if (session) bonusRollbackQuery.session(session);
                        await bonusRollbackQuery;
                    }
                }
            } else {
                const staleSolvedQuery = User.updateOne(
                    { _id: user._id },
                    { $pull: { solvedQuestionIds: itemIdText } },
                    session ? { session } : {}
                );
                if (session) staleSolvedQuery.session(session);
                await staleSolvedQuery;
            }

            const updatedUserQuery = User.findById(user._id).select('stats solvedQuestionIds prefs');
            if (session) updatedUserQuery.session(session);
            const updatedUser = await updatedUserQuery;
            if (!updatedUser) throw createHttpError(404, 'User not found');

            const weekly = await loadWeeklyGoalState(updatedUser, session);
            const nextLevel = computeLevel(updatedUser.stats?.xpTotal || 0).level;

            return {
                stats: updatedUser.stats,
                solvedQuestionIds: Array.isArray(updatedUser.solvedQuestionIds) ? updatedUser.solvedQuestionIds : [],
                xpRemoved,
                levelDown: rollbackApplied && nextLevel < prevLevel,
                rollbackApplied,
                weeklyGoal: {
                    completed: weekly.weeklyCompleted,
                    target: weekly.settings.target,
                    reached: weekly.reached,
                    bonusGranted: weekly.awarded || weekly.bonusAlreadyGranted,
                    bonusRevoked,
                },
                dailyChallenge: {
                    revoked: dailyChallengeRevoked,
                },
            };
        };

        let payload = null;
        const txSession = await mongoose.startSession();
        try {
            try {
                await txSession.withTransaction(async () => {
                    payload = await runRollback(txSession);
                });
            } catch (txErr) {
                if (!isTransactionUnsupportedError(txErr)) throw txErr;
                console.warn('[activity] Transactions are unavailable. Falling back to non-transactional rollback.');
                payload = await runRollback(null);
            }
        } finally {
            await txSession.endSession();
        }

        if (!payload) throw new Error('Activity rollback failed without a result.');
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

        const todayStr = dayKeyInTimezone(new Date());
        // Streaks
        const current = readActiveActivityStreakCurrent(user.stats?.streak, todayStr);
        const best = user.stats?.streak?.longest ?? user.stats?.streak?.best ?? 0;

        // Freeze tokens (optional, defaults 0)
        const freezeTokens = Number(user.stats?.freezeTokens ?? 0);

        // Today credits (0..3)
        const todayCompleted = await countTodayCompletedKinds(req.auth.userId, todayStr);
        const todayTotal = Array.from(SOLVE_KINDS).length;
        const todayProgress = Math.min(1, todayTotal ? todayCompleted / todayTotal : 1);

        const { settings: weeklyGoalSettings, weekBounds } = await ensureCurrentWeeklyGoalState(user);
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
