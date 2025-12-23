import { NextFunction, Request, Response } from 'express';
import { RequestWithUser } from '../../config/middleware/jwtAuth';
import HttpError from '../../config/error';
import AdminService from './service';

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const users = await AdminService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin count (admin only)
 */
export async function getAdminCount(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const count = await AdminService.getAdminCount();
        res.status(200).json({ count });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const user = await AdminService.getUserById(id);
        res.status(200).json(user);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Create user (admin only)
 */
export async function createUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const userEmail = req.email || (req.user as any)?.email;
        const user = await AdminService.createUser(req.body);
        
        // Create audit log
        await AdminService.createAuditLog(
            'CREATE_USER',
            userEmail || 'system',
            'USER',
            { userId: user._id, email: user.email, role: user.role, branch: user.branch },
            user._id.toString(),
            user._id.toString(),
            req.ip
        );

        res.status(201).json(user);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Update user (admin only)
 */
export async function updateUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.email || (req.user as any)?.email;
        const user = await AdminService.updateUser(id, req.body);
        
        // Create audit log
        await AdminService.createAuditLog(
            'UPDATE_USER',
            userEmail || 'system',
            'USER',
            { userId: user._id, changes: req.body },
            user._id.toString(),
            user._id.toString(),
            req.ip
        );

        res.status(200).json(user);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.email || (req.user as any)?.email;
        const user = await AdminService.deleteUser(id);
        
        // Create audit log
        await AdminService.createAuditLog(
            'DELETE_USER',
            userEmail || 'system',
            'USER',
            { userId: user._id, email: user.email },
            user._id.toString(),
            user._id.toString(),
            req.ip
        );

        res.status(200).json(user);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get all FIRs (admin only)
 */
export async function getAllFIRs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const firs = await AdminService.getAllFIRs();
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get all proceedings (admin only)
 */
export async function getAllProceedings(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const proceedings = await AdminService.getAllProceedings();
        res.status(200).json(proceedings);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get system metrics (admin only)
 */
export async function getSystemMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await AdminService.getSystemMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get dashboard analytics (admin only)
 */
export async function getDashboardAnalytics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await AdminService.getSystemMetrics();
        // Add additional analytics if needed
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin dashboard metrics (admin only)
 */
export async function getAdminDashboardMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await AdminService.getAdminDashboardMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin city graph (admin only)
 */
export async function getAdminCityGraph(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await AdminService.getAdminCityGraph();
        res.status(200).json(data);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin writ type distribution (admin only)
 */
export async function getAdminWritTypeDistribution(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await AdminService.getAdminWritTypeDistribution();
        res.status(200).json(data);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin motion metrics (admin only)
 */
export async function getAdminMotionMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await AdminService.getAdminMotionMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get admin affidavit metrics (admin only)
 */
export async function getAdminAffidavitMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await AdminService.getAdminAffidavitMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const filters: any = {};
        
        if (req.query.userEmail) filters.userEmail = req.query.userEmail as string;
        if (req.query.action) filters.action = req.query.action as string;
        if (req.query.resourceType) filters.resourceType = req.query.resourceType as string;
        if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
        if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
        if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
        if (req.query.skip) filters.skip = parseInt(req.query.skip as string, 10);

        const logs = await AdminService.getAuditLogs(filters);
        res.status(200).json(logs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get system config (admin only)
 */
export async function getConfig(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const config = await AdminService.getConfig();
        res.status(200).json(config);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Update system config (admin only)
 */
export async function updateConfig(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { key, value, description } = req.body;
        const userEmail = req.email || (req.user as any)?.email;
        
        if (!key) {
            return next(new HttpError(400, 'Key is required'));
        }

        const config = await AdminService.updateConfig(key, value, description || '', userEmail || 'system');
        
        // Create audit log
        await AdminService.createAuditLog(
            'UPDATE_CONFIG',
            userEmail || 'system',
            'CONFIG',
            { key, value, description },
            key,
            undefined,
            req.ip
        );

        res.status(200).json(config);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
