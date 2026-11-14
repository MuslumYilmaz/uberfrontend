'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const { loadQuestionLists, parseFreeUnlock, sameUnlock } = require('../services/free-unlock');

const router = express.Router();

// POST /api/users/me/free-unlock spends the account's one free unlock on a reported question of a company guide.
// It is written once and never moved: asking again for the same question answers with it, any other is refused.
router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = parseFreeUnlock(req.body, loadQuestionLists());
    if (parsed.error) return res.status(parsed.status).json({ code: parsed.code, error: parsed.error });

    // Atomic: two tabs spending the unlock at once cannot both win.
    const updated = await User.findOneAndUpdate(
      { _id: req.auth.userId, freeUnlock: null },
      { $set: { freeUnlock: parsed.value } },
      { new: true },
    ).select('freeUnlock');
    if (updated) return res.json({ freeUnlock: updated.freeUnlock });

    const user = await User.findById(req.auth.userId).select('freeUnlock');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (sameUnlock(user.freeUnlock, parsed.value)) return res.json({ freeUnlock: user.freeUnlock });
    return res.status(409).json({ code: 'FREE_UNLOCK_USED', error: 'The free unlock is already used.', freeUnlock: user.freeUnlock });
  } catch (error) {
    console.error('Failed to spend the free unlock:', error);
    return res.status(500).json({ error: 'Failed to open the question' });
  }
});

module.exports = router;
