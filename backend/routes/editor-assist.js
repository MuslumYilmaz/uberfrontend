const router = require('express').Router();
const { requireAuth } = require('../middleware/Auth');
const { rateLimit } = require('../middleware/rateLimit');
const EditorAssistAttempt = require('../models/EditorAssistAttempt');

const MAX_RUNS_PER_REQUEST = 200;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

const MAX_QUESTION_ID_LEN = 160;
const MAX_SIGNATURE_LEN = 1200;
const MAX_FIRST_FAIL_NAME_LEN = 240;
const MAX_ERROR_LINE_LEN = 1200;
const MAX_CODE_HASH_LEN = 200;
const MAX_TAGS = 8;
const MAX_TAG_LEN = 40;

const VALID_LANGS = new Set(['js', 'ts']);
const VALID_ERROR_CATEGORIES = new Set([
  'missing-return',
  'undefined-access',
  'wrong-function-call',
  'type-mismatch',
  'off-by-one',
  'async-promise-mismatch',
  'reference-error',
  'assertion-mismatch',
  'syntax-error',
  'timeout',
  'mutability-side-effect',
  'edge-case',
  'unknown',
]);

function toClampedInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function toNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function toBoundedString(value, maxLen) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  return text.slice(0, maxLen);
}

function toRequiredBoundedString(value, fieldName, maxLen) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return { error: `${fieldName} is required` };
  if (text.length > maxLen) {
    return { error: `${fieldName} exceeds ${maxLen} characters` };
  }
  return { value: text };
}

function toRequiredNonNegativeInt(value, fieldName) {
  if (value == null || value === '') {
    return { error: `${fieldName} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return { error: `${fieldName} must be a non-negative number` };
  }
  return { value: Math.floor(n) };
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = [];
  for (const item of value) {
    const tag = toBoundedString(item, MAX_TAG_LEN).toLowerCase();
    if (!tag) continue;
    if (tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

function normalizeRun(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'run must be an object' };
  }

  const questionIdResult = toRequiredBoundedString(raw.questionId, 'questionId', MAX_QUESTION_ID_LEN);
  if (questionIdResult.error) return { error: questionIdResult.error };
  const questionId = questionIdResult.value;

  const signatureResult = toRequiredBoundedString(raw.signature, 'signature', MAX_SIGNATURE_LEN);
  if (signatureResult.error) return { error: signatureResult.error };
  const signature = signatureResult.value;

  const lang = String(raw.lang || '').trim().toLowerCase();
  if (!VALID_LANGS.has(lang)) return { error: 'lang must be "js" or "ts"' };

  const tsRaw = Number(raw.ts);
  if (!Number.isFinite(tsRaw) || tsRaw < 0) {
    return { error: 'ts must be a non-negative number' };
  }
  const ts = Math.floor(tsRaw);

  const passCountResult = toRequiredNonNegativeInt(raw.passCount, 'passCount');
  if (passCountResult.error) return { error: passCountResult.error };
  const totalCountResult = toRequiredNonNegativeInt(raw.totalCount, 'totalCount');
  if (totalCountResult.error) return { error: totalCountResult.error };
  const passCount = passCountResult.value;
  const totalCount = totalCountResult.value;
  if (passCount > totalCount) {
    return { error: 'passCount cannot exceed totalCount' };
  }

  const firstFailName = toBoundedString(raw.firstFailName, MAX_FIRST_FAIL_NAME_LEN);
  const errorLine = toBoundedString(raw.errorLine, MAX_ERROR_LINE_LEN);
  const codeHash = toBoundedString(raw.codeHash, MAX_CODE_HASH_LEN);
  const codeChanged = Boolean(raw.codeChanged);
  const interviewMode = Boolean(raw.interviewMode);
  const errorCategoryRaw = String(raw.errorCategory || '').trim();
  const errorCategory = VALID_ERROR_CATEGORIES.has(errorCategoryRaw) ? errorCategoryRaw : 'unknown';
  const tags = normalizeTags(raw.tags);
  const minuteBucket = Math.floor(ts / 60_000);
  const recordKey = `${questionId}|${signature}|${minuteBucket}`;

  return {
    value: {
      questionId,
      lang,
      ts,
      passCount,
      totalCount,
      firstFailName,
      errorLine,
      signature,
      codeHash,
      codeChanged,
      interviewMode,
      errorCategory,
      tags,
      minuteBucket,
      recordKey,
    },
  };
}

function shouldReplaceExisting(existingDoc, nextRun) {
  const prevTs = Number(existingDoc?.ts || 0);
  const nextTs = Number(nextRun?.ts || 0);
  if (nextTs > prevTs) return true;
  if (nextTs < prevTs) return false;
  return Number(nextRun?.passCount || 0) > Number(existingDoc?.passCount || 0);
}

function toApiRun(doc) {
  return {
    questionId: doc.questionId,
    lang: doc.lang,
    ts: doc.ts,
    passCount: doc.passCount,
    totalCount: doc.totalCount,
    firstFailName: doc.firstFailName || '',
    errorLine: doc.errorLine || '',
    signature: doc.signature,
    codeHash: doc.codeHash || '',
    codeChanged: Boolean(doc.codeChanged),
    interviewMode: Boolean(doc.interviewMode),
    errorCategory: doc.errorCategory || 'unknown',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    recordKey: doc.recordKey,
    syncedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : undefined,
  };
}

router.post(
  '/sync',
  requireAuth,
  rateLimit({
    windowMs: 60_000,
    max: 120,
    keyGenerator: (req) => req?.auth?.userId || req.ip || 'unknown',
    message: 'Too many editor assist sync requests. Please try again shortly.',
  }),
  async (req, res) => {
    try {
      const body = req.body || {};
      const rawRuns = Array.isArray(body.runs) ? body.runs : [];
      if (rawRuns.length > MAX_RUNS_PER_REQUEST) {
        return res.status(400).json({ error: `runs must include at most ${MAX_RUNS_PER_REQUEST} items` });
      }

      const limit = toClampedInt(body.limit, DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT);
      const cursorTs = Math.max(0, toNonNegativeInt(body.cursorTs, 0));
      const userId = req.auth.userId;

      const normalizedRuns = [];
      for (let i = 0; i < rawRuns.length; i += 1) {
        const result = normalizeRun(rawRuns[i]);
        if (result.error) {
          return res.status(400).json({ error: `runs[${i}] ${result.error}` });
        }
        normalizedRuns.push(result.value);
      }

      const stats = {
        received: normalizedRuns.length,
        upserted: 0,
        deduped: 0,
        returned: 0,
      };

      for (const run of normalizedRuns) {
        const selector = { userId, recordKey: run.recordKey };
        let existing = await EditorAssistAttempt.findOne(selector).lean();

        if (!existing) {
          try {
            await EditorAssistAttempt.create({ userId, ...run });
            stats.upserted += 1;
            continue;
          } catch (err) {
            if (!(err && err.code === 11000)) throw err;
            existing = await EditorAssistAttempt.findOne(selector).lean();
          }
        }

        if (!existing) {
          stats.deduped += 1;
          continue;
        }

        if (!shouldReplaceExisting(existing, run)) {
          stats.deduped += 1;
          continue;
        }

        await EditorAssistAttempt.updateOne(
          selector,
          { $set: run }
        );
        stats.upserted += 1;
      }

      // Snapshot cursor closes the response window and avoids skipping records
      // updated between query execution and response serialization.
      const responseCursorTs = Date.now();
      const query = {
        userId,
        updatedAt: { $lte: new Date(responseCursorTs) },
      };
      if (cursorTs > 0) {
        query.updatedAt.$gt = new Date(cursorTs);
      }

      let docs = await EditorAssistAttempt.find(query)
        .sort(cursorTs > 0 ? { updatedAt: 1 } : { ts: -1 })
        .limit(limit)
        .lean();

      if (cursorTs <= 0) {
        docs = docs.reverse();
      }

      const runs = docs.map(toApiRun);
      stats.returned = runs.length;

      return res.json({
        runs,
        cursorTs: responseCursorTs,
        stats,
      });
    } catch (error) {
      return res.status(500).json({ error: error?.message || 'Failed to sync editor assist telemetry' });
    }
  }
);

module.exports = router;
