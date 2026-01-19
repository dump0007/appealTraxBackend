import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../config/error';
import { RequestWithUser } from '../../config/middleware/jwtAuth';
import { AuditLogModel } from './model';

/**
 * GET /v1/admin/audit/operations
 * Admin-only endpoint (protected by router middleware).
 * Supports filtering and pagination.
 */
export async function getOperationLogs(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const {
            entityType,
            entityId,
            actorEmail,
            action,
            branch,
            startDate,
            endDate,
            page = '1',
            limit = '20',
        } = req.query;

        const query: any = {};
        if (entityType) query.entityType = entityType;
        if (entityId) query.entityId = entityId;
        if (actorEmail) query.actorEmail = actorEmail;
        if (action) query.action = action;
        if (branch) query.branch = branch;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
        const limitNum = Math.max(Math.min(parseInt(limit as string, 10) || 20, 100), 1);
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            AuditLogModel.countDocuments(query),
        ]);

        res.status(200).json({
            data,
            total,
            page: pageNum,
            limit: limitNum,
        });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
