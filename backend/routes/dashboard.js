const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
const { getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge');
const {
  buildDashboardPayload,
  buildPrepGoal,
  sanitizePrepGoalLevel,
  sanitizePrepGoalTech,
} = require('../services/gamification/dashboard');

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('prefs stats solvedQuestionIds accessTier entitlements');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await getOrCreateDailyChallenge({ user });
    const completion = challenge
      ? await DailyChallengeCompletion.findOne({
          userId: user._id,
          dayKey: challenge.dayKey,
        }).lean()
      : null;

    const payload = await buildDashboardPayload(user, {
      challenge,
      challengeCompletion: completion,
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to build dashboard' });
  }
});

router.post('/prep-goal', requireAuth, async (req, res) => {
  try {
    const hasTech = Object.prototype.hasOwnProperty.call(req.body || {}, 'tech');
    const tech = hasTech ? sanitizePrepGoalTech(req.body?.tech) : 'javascript';
    const level = sanitizePrepGoalLevel(req.body?.level);
    if (!tech) return res.status(400).json({ error: 'Invalid prep goal tech' });
    if (!level) return res.status(400).json({ error: 'Invalid prep goal level' });

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      {
        $set: {
          'prefs.prepGoal.tech': 'javascript',
          'prefs.prepGoal.level': level,
        },
      },
      {
        new: true,
        runValidators: true,
        select: 'prefs',
      },
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ goal: buildPrepGoal(user) });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to save prep goal' });
  }
});

module.exports = router;
