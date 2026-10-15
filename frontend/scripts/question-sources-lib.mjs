// Shared validation for the optional `sources` array on coding, debug and system-design meta entries.
// Kept outside lint-questions.mjs so it can be unit-tested without running the CLI.

export const QUESTION_SOURCE_KEYS = ["label", "url", "publisher", "date", "note", "company"];
export const QUESTION_SOURCE_COMPANY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_QUESTION_SOURCES = 6;
export const QUESTION_SOURCE_LABEL_LENGTH = { min: 8, max: 120 };
export const QUESTION_SOURCE_PUBLISHER_LENGTH = { min: 2, max: 40 };
export const QUESTION_SOURCE_NOTE_MAX = 280;

const DATE_RE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const FORBIDDEN_PROVENANCE = [/known questions/i, /candidate reports/i];

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function todayParts(today) {
  const d = today instanceof Date ? today : new Date(today);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function validateQuestionSourceDate(value, today = new Date()) {
  if (typeof value !== "string") return "must be a YYYY-MM or YYYY-MM-DD string.";
  const match = DATE_RE.exec(value.trim());
  if (!match) return `must be YYYY-MM or YYYY-MM-DD (got ${JSON.stringify(value)}).`;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : null;
  if (year < 2000 || month < 1 || month > 12) return `is not a valid calendar date (${value}).`;
  if (day !== null) {
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
      return `is not a valid calendar date (${value}).`;
    }
  }
  const now = todayParts(today);
  const future = year > now.year
    || (year === now.year && month > now.month)
    || (year === now.year && month === now.month && day !== null && day > now.day);
  if (future) return `must not be in the future (${value}).`;
  return null;
}

/**
 * Returns a list of error messages for a `sources` value. An empty list means the value is valid.
 * `sources` must be an array of 1..6 objects with exactly the known keys.
 */
export function validateQuestionSources(sources, { today = new Date(), companies = null } = {}) {
  const errors = [];
  if (!Array.isArray(sources)) {
    errors.push("sources must be an array of 1 to 6 entries.");
    return errors;
  }
  if (sources.length < 1 || sources.length > MAX_QUESTION_SOURCES) {
    errors.push(`sources must contain 1 to ${MAX_QUESTION_SOURCES} entries (got ${sources.length}).`);
  }

  const seenUrls = new Set();
  sources.forEach((source, index) => {
    const where = `sources[${index}]`;
    if (!isPlainObject(source)) {
      errors.push(`${where} must be an object.`);
      return;
    }

    for (const key of Object.keys(source)) {
      if (!QUESTION_SOURCE_KEYS.includes(key)) {
        errors.push(`${where} has an unknown key: ${key}`);
      }
    }

    const label = typeof source.label === "string" ? source.label.trim() : "";
    if (label.length < QUESTION_SOURCE_LABEL_LENGTH.min || label.length > QUESTION_SOURCE_LABEL_LENGTH.max) {
      errors.push(`${where}.label must be ${QUESTION_SOURCE_LABEL_LENGTH.min} to ${QUESTION_SOURCE_LABEL_LENGTH.max} characters.`);
    }

    const publisher = typeof source.publisher === "string" ? source.publisher.trim() : "";
    if (publisher.length < QUESTION_SOURCE_PUBLISHER_LENGTH.min || publisher.length > QUESTION_SOURCE_PUBLISHER_LENGTH.max) {
      errors.push(`${where}.publisher must be ${QUESTION_SOURCE_PUBLISHER_LENGTH.min} to ${QUESTION_SOURCE_PUBLISHER_LENGTH.max} characters.`);
    }

    let parsedUrl = null;
    try {
      parsedUrl = typeof source.url === "string" ? new URL(source.url.trim()) : null;
    } catch {
      parsedUrl = null;
    }
    if (!parsedUrl || parsedUrl.protocol !== "https:") {
      errors.push(`${where}.url must be an https URL.`);
    } else if (seenUrls.has(parsedUrl.href)) {
      errors.push(`${where}.url duplicates an earlier source (${parsedUrl.href}).`);
    } else {
      seenUrls.add(parsedUrl.href);
    }

    const dateError = validateQuestionSourceDate(source.date, today);
    if (dateError) errors.push(`${where}.date ${dateError}`);

    if (source.note !== undefined) {
      const note = typeof source.note === "string" ? source.note.trim() : "";
      if (!note || note.length > QUESTION_SOURCE_NOTE_MAX) {
        errors.push(`${where}.note must be a non-empty string of at most ${QUESTION_SOURCE_NOTE_MAX} characters.`);
      }
    }

    if (source.company !== undefined) {
      const company = typeof source.company === "string" ? source.company.trim() : "";
      if (!QUESTION_SOURCE_COMPANY_RE.test(company)) {
        errors.push(`${where}.company must be a lowercase company slug.`);
      } else if (Array.isArray(companies) && !companies.map((value) => String(value).trim().toLowerCase()).includes(company)) {
        errors.push(`${where}.company (${company}) is not one of the entry's companies.`);
      }
    }

    for (const text of [source.label, source.note]) {
      if (typeof text !== "string") continue;
      for (const pattern of FORBIDDEN_PROVENANCE) {
        if (pattern.test(text)) {
          errors.push(`${where} must not claim provenance with "${pattern.source}".`);
        }
      }
    }
  });

  return errors;
}
