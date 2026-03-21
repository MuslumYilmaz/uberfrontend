const router = require('express').Router();
const PracticeProgress = require('../models/PracticeProgress');
const { requireAuth } = require('../middleware/Auth');

const VALID_FAMILIES = new Set(['question', 'incident', 'code-review', 'tradeoff-battle']);

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sanitizeFamily(value) {
  const family = String(value || '').trim();
  return VALID_FAMILIES.has(family) ? family : null;
}

function sanitizeBestScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

function sanitizeExtension(family, value) {
  if (!isPlainObject(value)) return {};
  if (family === 'incident') {
    if (typeof value.reflectionNote !== 'string') return {};
    return {
      reflectionNote: String(value.reflectionNote).slice(0, 240),
    };
  }
  return value;
}

function mergeExtension({
  family,
  currentExtension,
  currentLastPlayedAt,
  incomingExtensionRaw,
  incomingLastPlayedAt,
}) {
  const existing = isPlainObject(currentExtension) ? currentExtension : {};
  const incoming = sanitizeExtension(family, incomingExtensionRaw);

  if (family === 'incident') {
    const hasIncomingReflection = isPlainObject(incomingExtensionRaw)
      && Object.prototype.hasOwnProperty.call(incomingExtensionRaw, 'reflectionNote')
      && typeof incomingExtensionRaw.reflectionNote === 'string';

    if (!hasIncomingReflection) return existing;
    const currentTs = currentLastPlayedAt?.getTime?.() || 0;
    const incomingTs = incomingLastPlayedAt?.getTime?.() || 0;
    if (incomingTs >= currentTs) {
      return {
        ...existing,
        ...incoming,
      };
    }
    return existing;
  }

  if (!Object.keys(incoming).length) return existing;
  const currentTs = currentLastPlayedAt?.getTime?.() || 0;
  const incomingTs = incomingLastPlayedAt?.getTime?.() || 0;
  return incomingTs >= currentTs ? { ...existing, ...incoming } : existing;
}

function toResponseRecord(doc) {
  return {
    family: String(doc.family || ''),
    itemId: String(doc.itemId || ''),
    started: doc.started === true,
    completed: doc.completed === true,
    passed: doc.passed === true,
    bestScore: Number(doc.bestScore || 0),
    lastPlayedAt: doc.lastPlayedAt instanceof Date
      ? doc.lastPlayedAt.toISOString()
      : (doc.lastPlayedAt ? new Date(doc.lastPlayedAt).toISOString() : null),
    extension: isPlainObject(doc.extension) ? doc.extension : {},
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const family = sanitizeFamily(req.query.family);
    if (req.query.family && !family) {
      return res.status(400).json({ error: 'Invalid family' });
    }

    const query = {
      userId: req.auth.userId,
    };
    if (family) query.family = family;

    const records = await PracticeProgress.find(query)
      .sort({ family: 1, itemId: 1 })
      .lean();

    return res.json({
      records: records.map((record) => toResponseRecord(record)),
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to load practice progress' });
  }
});

router.put('/:family/:itemId', requireAuth, async (req, res) => {
  try {
    const family = sanitizeFamily(req.params.family);
    const itemId = String(req.params.itemId || '').trim();
    if (!family) return res.status(400).json({ error: 'Invalid family' });
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const incomingLastPlayedAt = parseDate(req.body?.lastPlayedAt) || new Date();
    const existing = await PracticeProgress.findOne({
      userId: req.auth.userId,
      family,
      itemId,
    });

    const currentLastPlayedAt = existing?.lastPlayedAt ? new Date(existing.lastPlayedAt) : null;
    const mergedLastPlayedAt = !currentLastPlayedAt
      ? incomingLastPlayedAt
      : (incomingLastPlayedAt > currentLastPlayedAt ? incomingLastPlayedAt : currentLastPlayedAt);

    const merged = {
      userId: req.auth.userId,
      family,
      itemId,
      started: (existing?.started === true) || req.body?.started === true,
      completed: (existing?.completed === true) || req.body?.completed === true,
      passed: (existing?.passed === true) || req.body?.passed === true,
      bestScore: Math.max(Number(existing?.bestScore || 0), sanitizeBestScore(req.body?.bestScore)),
      lastPlayedAt: mergedLastPlayedAt,
      extension: mergeExtension({
        family,
        currentExtension: existing?.extension,
        currentLastPlayedAt,
        incomingExtensionRaw: req.body?.extension,
        incomingLastPlayedAt,
      }),
    };

    const record = await PracticeProgress.findOneAndUpdate(
      { userId: req.auth.userId, family, itemId },
      { $set: merged },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      record: toResponseRecord(record),
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to save practice progress' });
  }
});

module.exports = router;
