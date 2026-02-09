const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const DailyChallengeCompletion = require('../models/DailyChallengeCompletion');
const { getOrCreateDailyChallenge } = require('../services/gamification/daily-challenge');
const { buildDashboardPayload } = require('../services/gamification/dashboard');

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('prefs stats solvedQuestionIds');
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

module.exports = router;
