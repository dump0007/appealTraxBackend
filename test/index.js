// Test setup and teardown
require('./setup');
require('./teardown');

// Core test files
require('./authentication.test');
require('./security.test');
require('./fileUpload.test');
require('./integration.test');
require('./edge-cases.test');

// User panel tests
require('./user/fir.test');
require('./user/proceeding.test');
require('./user/dashboard.test');

// Admin panel tests
require('./admin/users.test');
require('./admin/fir.test');
require('./admin/proceeding.test');
require('./admin/analytics.test');
require('./admin/branches.test');
require('./admin/audit-logs.test');
require('./admin/config.test');
require('./admin/auditlog.test');