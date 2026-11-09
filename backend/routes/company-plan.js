'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/Auth');
const User = require('../models/User');
const {
  loadCompanyPlanCatalog,
  nextCompanyPlan,
  parseCompanyPlanAnswers,
  parseCompanyPlanMark,
} = require('../services/company-plan');

const router = express.Router();

// PUT /api/users/me/company-plan saves the form answers. Any account can hold a plan, paid or not: it is written
// before checkout and outlives a subscription. Billing, XP, streaks and solvedQuestionIds are not touched here.
router.put('/', requireAuth, async (req, res) => {
  try {
    const parsed = parseCompanyPlanAnswers(req.body, loadCompanyPlanCatalog());
    if (parsed.error) return res.status(400).json({ code: 'COMPANY_PLAN_INVALID', error: parsed.error });

    const user = await User.findById(req.auth.userId).select('companyPlan');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const companyPlan = nextCompanyPlan(user.companyPlan, parsed.value, new Date());
    const updated = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: { companyPlan } },
      { new: true, runValidators: true },
    ).select('companyPlan');
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ companyPlan: updated.companyPlan });
  } catch (error) {
    console.error('Failed to save company plan:', error);
    return res.status(500).json({ error: 'Failed to save company plan' });
  }
});

// PATCH /api/users/me/company-plan flips one mark. The update is atomic, so two quick clicks cannot lose each other.
router.patch('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('companyPlan');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.companyPlan) return res.status(404).json({ code: 'COMPANY_PLAN_MISSING', error: 'No company plan yet' });

    const parsed = parseCompanyPlanMark(req.body, user.companyPlan, loadCompanyPlanCatalog());
    if (parsed.error) return res.status(400).json({ code: 'COMPANY_PLAN_INVALID', error: parsed.error });

    const { field, id, on } = parsed.value;
    const updated = await User.findOneAndUpdate(
      { _id: req.auth.userId, companyPlan: { $ne: null } },
      on ? { $addToSet: { [field]: id } } : { $pull: { [field]: id } },
      { new: true },
    ).select('companyPlan');
    if (!updated) return res.status(404).json({ code: 'COMPANY_PLAN_MISSING', error: 'No company plan yet' });
    return res.json({ companyPlan: updated.companyPlan });
  } catch (error) {
    console.error('Failed to update company plan:', error);
    return res.status(500).json({ error: 'Failed to update company plan' });
  }
});

module.exports = router;
