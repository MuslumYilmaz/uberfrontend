'use strict';

const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

function withDbName(uri, dbName) {
  const base = String(uri || '');
  return base.endsWith('/') ? `${base}${dbName}` : `${base}/${dbName}`;
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

describe('PasswordReset index compatibility', () => {
  const dbName = 'password_reset_index_test';
  const originalEnv = {
    MONGO_TARGET: process.env.MONGO_TARGET,
    MONGO_URL_TEST: process.env.MONGO_URL_TEST,
    EXPECTED_MONGO_DB_NAME_TEST: process.env.EXPECTED_MONGO_DB_NAME_TEST,
  };

  let mongoServer;
  let rawClient;
  let disconnectMongo;

  afterEach(async () => {
    if (disconnectMongo) await disconnectMongo();
    if (rawClient) await rawClient.close();
    if (mongoServer) await mongoServer.stop();

    restoreEnv('MONGO_TARGET', originalEnv.MONGO_TARGET);
    restoreEnv('MONGO_URL_TEST', originalEnv.MONGO_URL_TEST);
    restoreEnv('EXPECTED_MONGO_DB_NAME_TEST', originalEnv.EXPECTED_MONGO_DB_NAME_TEST);
  });

  test('accepts the deployed four-field active-token index', async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = withDbName(mongoServer.getUri(), dbName);

    rawClient = new MongoClient(uri);
    await rawClient.connect();
    await rawClient.db().collection('passwordresets').createIndex(
      { userId: 1, consumedAt: 1, supersededAt: 1, expiresAt: 1 },
      { name: 'idx_password_reset_active' }
    );
    await rawClient.close();
    rawClient = null;

    process.env.MONGO_TARGET = 'test';
    process.env.MONGO_URL_TEST = uri;
    process.env.EXPECTED_MONGO_DB_NAME_TEST = dbName;

    jest.resetModules();
    require('../models/PasswordReset');
    const mongo = require('../config/mongo');
    disconnectMongo = mongo.disconnectMongo;

    await expect(mongo.connectToMongo(uri)).resolves.toBeDefined();

    const mongoose = require('mongoose');
    const indexes = await mongoose.connection.collection('passwordresets').listIndexes().toArray();
    const matchingIndexes = indexes.filter(({ name }) => name === 'idx_password_reset_active');

    expect(matchingIndexes).toHaveLength(1);
    expect(Object.entries(matchingIndexes[0].key)).toEqual([
      ['userId', 1],
      ['consumedAt', 1],
      ['supersededAt', 1],
      ['expiresAt', 1],
    ]);
  });
});
