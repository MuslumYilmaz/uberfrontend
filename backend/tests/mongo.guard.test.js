'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

function withDbName(uri, dbName) {
  const base = String(uri || '');
  return base.endsWith('/') ? `${base}${dbName}` : `${base}/${dbName}`;
}

function parseDbName(uri) {
  const match = String(uri || '').match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : null;
}

describe('MongoDB guardrails', () => {
  test('connectToMongo fails fast when the connected db name does not match the expected name', async () => {
    const mongoServer = await MongoMemoryServer.create();
    const uri = withDbName(mongoServer.getUri(), 'mongo_guard_test');
    const actualDbName = parseDbName(uri);

    process.env.MONGO_URL_TEST = uri;
    process.env.EXPECTED_MONGO_DB_NAME_TEST = `${actualDbName}_wrong`;

    jest.resetModules();
    const { connectToMongo, disconnectMongo } = require('../config/mongo');

    try {
      await expect(connectToMongo(uri)).rejects.toMatchObject({
        code: 'MONGO_DB_NAME_MISMATCH',
      });
    } finally {
      delete process.env.EXPECTED_MONGO_DB_NAME_TEST;
      await disconnectMongo();
      await mongoServer.stop();
    }
  });
});
