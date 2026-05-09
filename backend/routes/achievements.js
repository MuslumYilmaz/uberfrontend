const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const { markAchievementsSeen } = require('../services/gamification/achievement-awards');

router.post('/seen', requireAuth, async (req, res) => {
  try {
    const result = await markAchievementsSeen({
      userId: req.auth.userId,
      ids: req.body?.ids,
    });

    return res.json({
      ok: true,
      ids: result.ids,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to mark achievements as seen' });
  }
});

module.exports = router;
