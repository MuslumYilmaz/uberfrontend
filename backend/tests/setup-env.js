'use strict';

// Keep the global protection active but out of the way of integration suites
// that intentionally exercise many requests against one in-process app.
process.env.API_RATE_LIMIT_MAX ||= '100000';
process.env.WEBHOOK_RATE_LIMIT_MAX ||= '100000';
process.env.RATE_LIMIT_STORE ||= 'memory';
process.env.INTERVIEW_MODE_ACCESS ||= 'off';
process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS ||= 'off';

// Local manual testing deliberately uses a named isolated database. Integration
// suites create their own ephemeral MongoDB database (normally `test`) and must
// not inherit EXPECTED_MONGO_DB_NAME_TEST from backend/.env when index.js loads
// dotenv later in the test process.
process.env.EXPECTED_MONGO_DB_NAME_TEST ||= 'test';
