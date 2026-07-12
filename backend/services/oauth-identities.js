function providerConflictError() {
  const error = new Error('This OAuth provider is already linked to another account.');
  error.code = 'OAUTH_PROVIDER_LINK_CONFLICT';
  return error;
}

function providerAmbiguousError() {
  const error = new Error('This OAuth provider is linked to multiple legacy accounts and requires support review.');
  error.code = 'OAUTH_PROVIDER_IDENTITY_AMBIGUOUS';
  return error;
}

async function findLegacyOwner(User, provider, providerId) {
  const owners = await User.find({
    providers: { $elemMatch: { provider, providerId } },
  }).select('_id').limit(2).lean();
  if (owners.length > 1) throw providerAmbiguousError();
  return owners[0] || null;
}

async function writeIdentityClaim(OAuthIdentity, provider, providerId, userId) {
  let identity;
  try {
    identity = await OAuthIdentity.findOneAndUpdate(
      { provider, providerId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    identity = await OAuthIdentity.findOne({ provider, providerId });
  }
  if (!identity || String(identity.userId) !== String(userId)) throw providerConflictError();
  return identity;
}

async function claimOAuthIdentity(OAuthIdentity, User, provider, providerId, userId) {
  // Do not accept link traffic until Mongo confirms the unique ownership index.
  await OAuthIdentity.init();
  const normalizedProviderId = String(providerId || '').trim();
  if (!provider || !normalizedProviderId || !userId) throw providerConflictError();

  const existingIdentity = await OAuthIdentity.findOne({ provider, providerId: normalizedProviderId });
  if (existingIdentity) {
    if (String(existingIdentity.userId) !== String(userId)) throw providerConflictError();
    return existingIdentity;
  }

  const legacyOwner = await findLegacyOwner(User, provider, normalizedProviderId);
  const ownerId = legacyOwner?._id || userId;
  const identity = await writeIdentityClaim(OAuthIdentity, provider, normalizedProviderId, ownerId);
  if (String(identity.userId) !== String(userId)) throw providerConflictError();
  return identity;
}

async function findOAuthIdentityUser(OAuthIdentity, User, provider, providerId) {
  // Existing-provider login also relies on the same atomic ownership invariant.
  await OAuthIdentity.init();
  const normalizedProviderId = String(providerId || '').trim();
  if (!provider || !normalizedProviderId) return null;

  const identity = await OAuthIdentity.findOne({ provider, providerId: normalizedProviderId }).lean();
  if (identity?.userId) return User.findById(identity.userId);

  const legacyOwner = await findLegacyOwner(User, provider, normalizedProviderId);
  if (!legacyOwner) return null;
  await writeIdentityClaim(OAuthIdentity, provider, normalizedProviderId, legacyOwner._id);
  return User.findById(legacyOwner._id);
}

module.exports = { claimOAuthIdentity, findOAuthIdentityUser };
