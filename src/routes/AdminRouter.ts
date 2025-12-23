import { Router } from 'express';
import { AdminComponent } from '../components';
import { isAuthenticated } from '../config/middleware/jwtAuth';
import { isAdmin } from '../config/middleware/adminAuth';

/**
 * @constant {express.Router}
 */
const router: Router = Router();

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

/**
 * User Management Routes
 */
router.get('/users', AdminComponent.getAllUsers);
router.get('/users/:id', AdminComponent.getUserById);
router.get('/users-count/admins', AdminComponent.getAdminCount);
router.post('/users', AdminComponent.createUser);
router.put('/users/:id', AdminComponent.updateUser);
router.delete('/users/:id', AdminComponent.deleteUser);

/**
 * Data Access Routes
 */
router.get('/firs', AdminComponent.getAllFIRs);
router.get('/proceedings', AdminComponent.getAllProceedings);

/**
 * Analytics Routes
 */
router.get('/metrics', AdminComponent.getSystemMetrics);
router.get('/analytics/dashboard', AdminComponent.getDashboardAnalytics);
router.get('/dashboard-metrics', AdminComponent.getAdminDashboardMetrics);
router.get('/city-graph', AdminComponent.getAdminCityGraph);
router.get('/writ-type-distribution', AdminComponent.getAdminWritTypeDistribution);
router.get('/motion-metrics', AdminComponent.getAdminMotionMetrics);
router.get('/affidavit-metrics', AdminComponent.getAdminAffidavitMetrics);

/**
 * Audit Log Routes
 */
router.get('/audit-logs', AdminComponent.getAuditLogs);

/**
 * Config Routes
 */
router.get('/config', AdminComponent.getConfig);
router.put('/config', AdminComponent.updateConfig);

/**
 * @export {express.Router}
 */
export default router;

