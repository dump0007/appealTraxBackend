import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import ProceedingService from './service';
import { HttpError } from '../../config/error';
import { IProceedingModel } from './model';

interface RequestWithUser extends Request {
    user?: { email?: string } | string;
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const items: IProceedingModel[] = await ProceedingService.findAll();
        res.status(200).json(items);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findByFIR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const items: IProceedingModel[] = await ProceedingService.findByFIR(req.params.firId);
        res.status(200).json(items);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const item: IProceedingModel = await ProceedingService.findOne(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function create(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        // Extract user info from request if available (from JWT auth)
        let createdBy: Types.ObjectId;
        if (req.user) {
            // If user is authenticated, use a placeholder ObjectId for now
            // In production, you would look up the Officer by email and use their _id
            const userEmail = typeof req.user === 'object' ? req.user.email : null;
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

        const item: IProceedingModel = await ProceedingService.insert(body);
        res.status(201).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const item: IProceedingModel = await ProceedingService.remove(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


