'use strict';

const APPROVED_EXPOSURE_RETENTION_DAYS = 365;
const EXPOSURE_COLLECTION_NAME = 'interviewcontentexposures';

const REQUIRED_EXPOSURE_INDEXES = Object.freeze([
  Object.freeze({
    name: 'userId_1',
    key: Object.freeze([Object.freeze(['userId', 1])]),
    unique: false,
    expireAfterSeconds: null,
  }),
  Object.freeze({
    name: 'uniq_interview_content_exposure_session',
    key: Object.freeze([Object.freeze(['sessionId', 1])]),
    unique: true,
    expireAfterSeconds: null,
  }),
  Object.freeze({
    name: 'idx_interview_exposure_target_history',
    key: Object.freeze([
      Object.freeze(['userId', 1]),
      Object.freeze(['format', 1]),
      Object.freeze(['track', 1]),
      Object.freeze(['level', 1]),
      Object.freeze(['exposedAt', -1]),
    ]),
    unique: false,
    expireAfterSeconds: null,
  }),
  Object.freeze({
    name: 'idx_interview_exposure_user_history',
    key: Object.freeze([
      Object.freeze(['userId', 1]),
      Object.freeze(['exposedAt', -1]),
    ]),
    unique: false,
    expireAfterSeconds: null,
  }),
  Object.freeze({
    name: 'ttl_interview_exposure_retention',
    key: Object.freeze([Object.freeze(['expiresAt', 1])]),
    unique: false,
    expireAfterSeconds: 0,
  }),
]);

function indexKeyObject(definition) {
  return Object.fromEntries(definition.key);
}

function indexOptions(definition) {
  return {
    name: definition.name,
    ...(definition.unique ? { unique: true } : {}),
    ...(definition.expireAfterSeconds == null
      ? {}
      : { expireAfterSeconds: definition.expireAfterSeconds }),
  };
}

function applyInterviewExposureIndexContract(schema) {
  for (const definition of REQUIRED_EXPOSURE_INDEXES) {
    schema.index(indexKeyObject(definition), indexOptions(definition));
  }
  return schema;
}

module.exports = {
  APPROVED_EXPOSURE_RETENTION_DAYS,
  EXPOSURE_COLLECTION_NAME,
  REQUIRED_EXPOSURE_INDEXES,
  applyInterviewExposureIndexContract,
  indexKeyObject,
  indexOptions,
};
