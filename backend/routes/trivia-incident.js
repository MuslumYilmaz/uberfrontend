'use strict';

const router = require('express').Router();
const { getTriviaIncidentMeta } = require('../services/gamification/question-catalog');

const VALID_TECHS = new Set(['javascript', 'react', 'angular', 'vue', 'html', 'css']);

function normalizeTech(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeOptionId(value) {
  return String(value || '').trim();
}

function toPublicIncident(meta) {
  return {
    questionId: meta.questionId,
    tech: meta.tech,
    title: meta.incidentCard.title,
    scenario: meta.incidentCard.scenario,
    options: meta.incidentCard.options.map((entry) => ({
      id: entry.id,
      label: entry.label,
    })),
  };
}

function resolveIncident(req, res) {
  const tech = normalizeTech(req.params.tech);
  const id = normalizeId(req.params.id);
  if (!VALID_TECHS.has(tech)) {
    res.status(400).json({ error: 'Invalid tech' });
    return null;
  }
  if (!id) {
    res.status(400).json({ error: 'Question id is required' });
    return null;
  }

  const meta = getTriviaIncidentMeta({ tech, itemId: id });
  if (!meta) {
    res.status(404).json({ error: 'Incident card not found for this trivia question' });
    return null;
  }

  return meta;
}

router.get('/:tech/:id/incident', (req, res) => {
  try {
    const meta = resolveIncident(req, res);
    if (!meta) return;
    return res.json(toPublicIncident(meta));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to load incident card' });
  }
});

router.post('/:tech/:id/incident/answer', (req, res) => {
  try {
    const meta = resolveIncident(req, res);
    if (!meta) return;

    const optionId = normalizeOptionId(req.body?.optionId);
    if (!optionId) {
      return res.status(400).json({ error: 'optionId is required' });
    }

    const validOption = meta.incidentCard.options.some((entry) => entry.id === optionId);
    if (!validOption) {
      return res.status(400).json({ error: 'Invalid optionId for this incident card' });
    }

    const correct = optionId === meta.incidentCard.correctOptionId;
    return res.json({
      questionId: meta.questionId,
      tech: meta.tech,
      correct,
      feedback: correct
        ? 'Correct root cause. You can mark this question as completed.'
        : meta.incidentCard.rereadPrompt,
      rereadRecommended: !correct,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to validate incident answer' });
  }
});

module.exports = router;
