import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import ProceedingService from './service';
import { HttpError } from '../../config/error';
import { IProceedingModel } from './model';

interface RequestWithUser extends Request {
    user?: { email?: string } | string;
    email?: string;
}

export async function findAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const items: IProceedingModel[] = await ProceedingService.findAll(email);
        res.status(200).json(items);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findByFIR(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const items: IProceedingModel[] = await ProceedingService.findByFIR(req.params.firId, email);
        res.status(200).json(items);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findOne(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const item: IProceedingModel = await ProceedingService.findOne(req.params.id, email);
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function create(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        
        // Extract user info from request if available (from JWT auth)
        let createdBy: Types.ObjectId;
        if (req.user) {
            // If user is authenticated, use a placeholder ObjectId for now
            // In production, you would look up the Officer by email and use their _id
            // For now, create a placeholder ObjectId - can be updated to use actual officer ID
            createdBy = new Types.ObjectId();
        } else {
            // If no auth, use placeholder
            createdBy = new Types.ObjectId();
        }

        // Ensure createdBy is set in body if not provided
        const body = req.body;
        if (!body.createdBy) {
            body.createdBy = createdBy;
        }

        const item: IProceedingModel = await ProceedingService.insert(body, email);
        res.status(201).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findDraftByFIR(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const item: IProceedingModel | null = await ProceedingService.findDraftByFIR(req.params.firId, email);
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function remove(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const item: IProceedingModel = await ProceedingService.remove(req.params.id, email);
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


