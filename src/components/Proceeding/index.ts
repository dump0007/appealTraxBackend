import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import ProceedingService from './service';
import { HttpError } from '../../config/error';
import { IProceedingModel } from './model';
import { validateProceedingFile, saveProceedingFile, deleteProceedingFile } from '../../config/middleware/fileUpload';

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

        // Handle file upload if present
        let orderOfProceedingFilename: string | undefined;
        if (req.files && req.files.orderOfProceeding) {
            const file = Array.isArray(req.files.orderOfProceeding) 
                ? req.files.orderOfProceeding[0] 
                : req.files.orderOfProceeding;
            
            // Validate file
            const validation = validateProceedingFile(file);
            if (!validation.valid) {
                return next(new HttpError(400, validation.error || 'Invalid file'));
            }

            // Save file
            try {
                orderOfProceedingFilename = await saveProceedingFile(file);
            } catch (error) {
                return next(new HttpError(500, `Failed to save file: ${error.message}`));
            }
        }

        // Parse body - handle both JSON and form-data
        let body: any;
        if (typeof req.body === 'string') {
            try {
                body = JSON.parse(req.body);
            } catch {
                body = req.body;
            }
        } else {
            body = req.body;
        }

        // If body has JSON string fields (common when using multipart/form-data), parse them
        const parseJsonField = (fieldName: keyof IProceedingModel) => {
            if (body[fieldName] && typeof body[fieldName] === 'string') {
                try {
                    body[fieldName] = JSON.parse(body[fieldName]);
                } catch {
                    // Keep as is if parsing fails
                }
            }
        };

        parseJsonField('hearingDetails');
        parseJsonField('noticeOfMotion' as keyof IProceedingModel);
        parseJsonField('replyTracking');
        parseJsonField('argumentDetails');
        parseJsonField('decisionDetails');

        // Add filename to body
        if (orderOfProceedingFilename) {
            body.orderOfProceedingFilename = orderOfProceedingFilename;
        }

        // Ensure createdBy is set in body if not provided
        if (!body.createdBy) {
            body.createdBy = createdBy;
        }

        const item: IProceedingModel = await ProceedingService.insert(body, email);
        res.status(201).json(item);
    } catch (error) {
        // If file was saved but proceeding creation failed, delete the file
        if (req.files && req.files.orderOfProceeding) {
            const file = Array.isArray(req.files.orderOfProceeding) 
                ? req.files.orderOfProceeding[0] 
                : req.files.orderOfProceeding;
            // Note: We can't easily get the saved filename here, but the file will be orphaned
            // In production, you might want to implement cleanup for orphaned files
        }
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


