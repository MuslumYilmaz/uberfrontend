function isDuplicateKeyError(err) {
  return !!err && (err.code === 11000 || err.code === 11001);
}

function createBillingEventStore(model) {
  async function recordEvent({ provider, eventId, eventType, email, payload, ...rest }) {
    try {
      await model.create({
        provider,
        eventId,
        eventType,
        email,
        payload,
        ...rest,
      });
      return { duplicate: false };
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return { duplicate: true };
      }
      throw err;
    }
  }

  return { recordEvent };
}

module.exports = { createBillingEventStore, isDuplicateKeyError };
