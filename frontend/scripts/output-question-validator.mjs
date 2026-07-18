const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_RUNTIMES = new Set(["browser", "node"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOutputLine(line) {
  return line.trim().replace(/[\t ]+/g, " ");
}

export function normalizeOutputLines(lines) {
  return lines.map(normalizeOutputLine).join("\n");
}

/**
 * Validate the optional output-question extension on a shipped question.
 *
 * Regular questions return no issues. Callers supply the asset context because
 * the technology/kind encoded in the file path is the authoritative boundary.
 */
export function validateOutputQuestion(question, { tech, kind } = {}) {
  const issues = [];

  if (!isObject(question)) {
    return ["Output question must be an object."];
  }

  const hasQuestionFormat = question.questionFormat !== undefined;
  const hasOutputChallenge = question.outputChallenge !== undefined;

  if (!hasQuestionFormat) {
    if (hasOutputChallenge) {
      issues.push('outputChallenge requires questionFormat: "output".');
    }
    return issues;
  }

  if (question.questionFormat !== "output") {
    issues.push('questionFormat must be "output" when provided.');
    if (hasOutputChallenge) {
      issues.push('outputChallenge requires questionFormat: "output".');
    }
    return issues;
  }

  if (tech !== "javascript" || kind !== "trivia") {
    issues.push('questionFormat: "output" is only supported for javascript/trivia questions.');
  }

  if (Object.hasOwn(question, "incidentCard")) {
    issues.push("Output questions must not define incidentCard.");
  }

  const challenge = question.outputChallenge;
  if (!isObject(challenge)) {
    issues.push("outputChallenge must be an object.");
    return issues;
  }

  if (challenge.language !== "javascript") {
    issues.push('outputChallenge.language must be "javascript".');
  }

  if (!ALLOWED_RUNTIMES.has(challenge.runtime)) {
    issues.push('outputChallenge.runtime must be either "browser" or "node".');
  }

  if (challenge.responseType !== "single-choice") {
    issues.push('outputChallenge.responseType must be "single-choice".');
  }

  for (const field of ["prompt", "code", "explanation"]) {
    if (!isNonEmptyString(challenge[field])) {
      issues.push(`outputChallenge.${field} must be a non-empty string.`);
    }
  }

  const options = challenge.options;
  if (!Array.isArray(options) || options.length !== 3) {
    issues.push("outputChallenge.options must contain exactly 3 options.");
    return issues;
  }

  const optionIds = new Set();
  const normalizedOutputs = new Set();

  options.forEach((option, index) => {
    const path = `outputChallenge.options[${index}]`;
    if (!isObject(option)) {
      issues.push(`${path} must be an object.`);
      return;
    }

    if (!isNonEmptyString(option.id) || !KEBAB_CASE_REGEX.test(option.id)) {
      issues.push(`${path}.id must be a non-empty kebab-case string.`);
    } else if (optionIds.has(option.id)) {
      issues.push(`${path}.id must be unique (duplicate: ${option.id}).`);
    } else {
      optionIds.add(option.id);
    }

    if (
      !Array.isArray(option.lines)
      || option.lines.length === 0
      || option.lines.some((line) => !isNonEmptyString(line))
    ) {
      issues.push(`${path}.lines must be a non-empty array of non-empty strings.`);
      return;
    }

    const outputKey = normalizeOutputLines(option.lines);
    if (normalizedOutputs.has(outputKey)) {
      issues.push(`${path}.lines must describe a unique output sequence.`);
    } else {
      normalizedOutputs.add(outputKey);
    }
  });

  if (!isNonEmptyString(challenge.correctOptionId) || !optionIds.has(challenge.correctOptionId)) {
    issues.push("outputChallenge.correctOptionId must reference an existing option id.");
  }

  return issues;
}
