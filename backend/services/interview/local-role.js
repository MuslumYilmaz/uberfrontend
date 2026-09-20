'use strict';

const crypto = require('crypto');

const ALLOWED_ROLES = new Set(['admin', 'user']);

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('--email must be a valid email address');
  return email;
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  if (!ALLOWED_ROLES.has(role)) throw new Error('--role must be either admin or user');
  return role;
}

function userReference(userId) {
  return crypto.createHash('sha256').update(String(userId || '')).digest('hex').slice(0, 12);
}

async function setLocalInterviewRole({
  collection,
  email,
  execute = false,
  role,
}) {
  if (!collection || typeof collection.findOne !== 'function') {
    throw new TypeError('A users collection is required');
  }
  const normalizedEmail = normalizeEmail(email);
  const targetRole = normalizeRole(role);
  const existing = await collection.findOne(
    { email: normalizedEmail },
    { projection: { _id: 1, role: 1 } }
  );
  if (!existing) {
    const error = new Error('No existing local user matches --email; refusing to create one');
    error.code = 'INTERVIEW_LOCAL_ROLE_USER_NOT_FOUND';
    throw error;
  }

  const currentRole = normalizeRole(existing.role || 'user');
  const changed = currentRole !== targetRole;
  if (execute && changed) {
    if (typeof collection.updateOne !== 'function') {
      throw new TypeError('The users collection cannot update roles');
    }
    const result = await collection.updateOne(
      { _id: existing._id, email: normalizedEmail, role: currentRole },
      { $set: { role: targetRole } },
      { upsert: false }
    );
    if (Number(result?.matchedCount || 0) !== 1) {
      const error = new Error('The local user changed while the role update was running');
      error.code = 'INTERVIEW_LOCAL_ROLE_STALE_USER';
      throw error;
    }
  }

  return {
    changed,
    currentRole,
    dryRun: !execute,
    resultingRole: execute ? targetRole : currentRole,
    targetRole,
    userReference: userReference(existing._id),
  };
}

module.exports = {
  ALLOWED_ROLES,
  normalizeEmail,
  normalizeRole,
  setLocalInterviewRole,
  userReference,
};
