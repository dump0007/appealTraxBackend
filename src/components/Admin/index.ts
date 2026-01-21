import { NextFunction, Request, Response } from 'express';
import { RequestWithUser } from '../../config/middleware/jwtAuth';
import HttpError from '../../config/error';
import AdminService from './service';
import ProceedingService from '../Proceeding/service';
import { IProceedingModel } from '../Proceeding/model';
import FIRService from '../FIR/service';
import { IFIRModel } from '../FIR/model';

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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const firs = await AdminService.getAllFIRs(startDate, endDate, branch);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Admin-specific FIR handlers - bypass branch/email restrictions
 */
export async function adminFindAllFIRs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const firs: IFIRModel[] = await AdminService.getAllFIRs(startDate, endDate, branch);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function adminFindFIRById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.findOne(req.params.id, email, undefined, true);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function adminCreateFIR(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.insert(req.body, email, undefined, true);
        res.status(201).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function adminUpdateFIR(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.update(req.params.id, req.body, email, undefined, true);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function adminDeleteFIR(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        await FIRService.remove(req.params.id, email, undefined, true);
        res.status(200).json({ message: 'FIR deleted successfully' });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get all proceedings (admin only)
 */
export async function getAllProceedings(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const proceedings = await AdminService.getAllProceedings(startDate, endDate, branch);
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const metrics = await AdminService.getAdminDashboardMetrics(startDate, endDate, branch);
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const data = await AdminService.getAdminCityGraph(startDate, endDate, branch);
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const data = await AdminService.getAdminWritTypeDistribution(startDate, endDate, branch);
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const metrics = await AdminService.getAdminMotionMetrics(startDate, endDate, branch);
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const branch = req.query.branch as string | undefined;
        const metrics = await AdminService.getAdminAffidavitMetrics(startDate, endDate, branch);
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get audit logs (admin only)
 */
export async function getUserActivityLogs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const filters: any = {};
        
        if (req.query.userEmail) {
            filters.userEmail = req.query.userEmail as string;
        }
        if (req.query.branch) {
            filters.branch = req.query.branch as string;
        }
        if (req.query.action) {
            filters.action = req.query.action as string;
        }
        if (req.query.resourceType) {
            filters.resourceType = req.query.resourceType as string;
        }
        if (req.query.startDate) {
            filters.startDate = new Date(req.query.startDate as string);
        }
        if (req.query.endDate) {
            filters.endDate = new Date(req.query.endDate as string);
        }
        if (req.query.limit) {
            filters.limit = parseInt(req.query.limit as string, 10);
        }
        if (req.query.skip) {
            filters.skip = parseInt(req.query.skip as string, 10);
        }
        
        const logs = await AdminService.getUserActivityLogs(filters);
        res.status(200).json(logs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

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

        // If no key provided, treat as read-only fetch to keep compatibility with tests
        if (!key) {
            const allConfig = await AdminService.getConfig();
            res.status(200).json(allConfig);
            return;
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

/**
 * Admin-specific proceeding handlers - bypass branch/email restrictions
 */

/**
 * Get all proceedings (admin only - no branch filter)
 */
export async function adminFindAllProceedings(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const items: IProceedingModel[] = await ProceedingService.findAll(email, undefined, true); // isAdmin = true
        res.status(200).json(items);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Get proceeding by ID (admin only - no branch filter)
 */
export async function adminFindProceedingById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const item = await ProceedingService.findOne(req.params.id, email, undefined, true); // isAdmin = true
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Create proceeding (admin only - no branch filter)
 */
export async function adminCreateProceeding(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const proceeding = await ProceedingService.insert(req.body, email, undefined, true); // isAdmin = true
        res.status(201).json(proceeding);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Update proceeding (admin only - no branch filter)
 */
export async function adminUpdateProceeding(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const proceeding = await ProceedingService.update(req.params.id, req.body, email, undefined, undefined, true); // isAdmin = true
        res.status(200).json(proceeding);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Delete proceeding (admin only - no branch filter)
 */
export async function adminDeleteProceeding(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        await ProceedingService.remove(req.params.id, email, undefined, true); // isAdmin = true
        res.status(200).json({ message: 'Proceeding deleted successfully' });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
