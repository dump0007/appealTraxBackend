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

        // Parse body - handle both JSON and form-data (must be done before processing files to set attachment fields)
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
        parseJsonField('anyOtherDetails');
        parseJsonField('decisionDetails' as keyof IProceedingModel);
        
        // Parse draft field - it comes as a string from FormData
        if (body.draft !== undefined) {
            if (typeof body.draft === 'string') {
                body.draft = body.draft === 'true' || body.draft === '1';
            } else if (typeof body.draft === 'boolean') {
                // Already boolean, keep as is
            } else {
                body.draft = Boolean(body.draft);
            }
        } else {
            body.draft = false; // Default to false if not provided
        }
        
        console.log(`[ProceedingController] Parsed draft field: ${body.draft} (type: ${typeof body.draft})`);

        // Handle file uploads
        let orderOfProceedingFilename: string | undefined;
        const attachments: Array<{ fileName: string; fileUrl: string }> = [];
        
        // Handle orderOfProceeding file (legacy support)
        if (req.files && req.files.orderOfProceeding) {
            const file = Array.isArray(req.files.orderOfProceeding) 
                ? req.files.orderOfProceeding[0] 
                : req.files.orderOfProceeding;
            
            const validation = validateProceedingFile(file);
            if (!validation.valid) {
                return next(new HttpError(400, validation.error || 'Invalid file'));
            }

            try {
                orderOfProceedingFilename = await saveProceedingFile(file);
            } catch (error) {
                return next(new HttpError(500, `Failed to save file: ${error.message}`));
            }
        }

        // Handle attachment files for all proceeding types
        if (req.files) {
            // Process Notice of Motion attachments
            const noticeOfMotionFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_noticeOfMotion_')
            );
            for (const key of noticeOfMotionFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) 
                    ? fileObj[0] 
                    : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    // Extract index from key (e.g., "attachments_noticeOfMotion_0" -> 0)
                    const indexMatch = key.match(/attachments_noticeOfMotion_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        // Set attachment filename in the corresponding record
                        if (body.noticeOfMotion) {
                            if (Array.isArray(body.noticeOfMotion)) {
                                if (body.noticeOfMotion[index]) {
                                    body.noticeOfMotion[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.noticeOfMotion.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process To File Reply attachments
            const replyTrackingFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_replyTracking_')
            );
            for (const key of replyTrackingFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) 
                    ? fileObj[0] 
                    : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    // Extract index from key (e.g., "attachments_replyTracking_0" -> 0)
                    const indexMatch = key.match(/attachments_replyTracking_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        // Set attachment filename in the corresponding record
                        if (body.replyTracking) {
                            if (Array.isArray(body.replyTracking)) {
                                if (body.replyTracking[index]) {
                                    body.replyTracking[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.replyTracking.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Argument attachments
            const argumentFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_argumentDetails_')
            );
            for (const key of argumentFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) 
                    ? fileObj[0] 
                    : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    // Extract index from key (e.g., "attachments_argumentDetails_0" -> 0)
                    const indexMatch = key.match(/attachments_argumentDetails_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        // Set attachment filename in the corresponding record
                        if (body.argumentDetails) {
                            if (Array.isArray(body.argumentDetails)) {
                                if (body.argumentDetails[index]) {
                                    body.argumentDetails[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.argumentDetails.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Any Other attachments
            const anyOtherFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_anyOtherDetails_')
            );
            for (const key of anyOtherFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) 
                    ? fileObj[0] 
                    : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    // Extract index from key (e.g., "attachments_anyOtherDetails_0" -> 0)
                    const indexMatch = key.match(/attachments_anyOtherDetails_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        // Set attachment filename in the corresponding record
                        if (body.anyOtherDetails) {
                            if (Array.isArray(body.anyOtherDetails)) {
                                if (body.anyOtherDetails[index]) {
                                    body.anyOtherDetails[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.anyOtherDetails.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Decision Details attachment
            if (req.files.attachments_decisionDetails) {
                const fileObj = req.files.attachments_decisionDetails;
                const file = Array.isArray(fileObj) 
                    ? fileObj[0] 
                    : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || 'Invalid decision details file'));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    // Set attachment filename in decision details
                    if (body.decisionDetails) {
                        body.decisionDetails.attachment = filename;
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save decision details file: ${error.message}`));
                }
            }
        }

        // Add filename to body
        if (orderOfProceedingFilename) {
            body.orderOfProceedingFilename = orderOfProceedingFilename;
        }

        // Add attachments to body
        if (attachments.length > 0) {
            body.attachments = attachments;
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

export async function update(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
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

        // Parse JSON string fields
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
        parseJsonField('anyOtherDetails');
        parseJsonField('decisionDetails' as keyof IProceedingModel);

        // Parse filesToDelete - comes as JSON string or array
        let filesToDelete: string[] = [];
        if (body.filesToDelete) {
            if (typeof body.filesToDelete === 'string') {
                try {
                    filesToDelete = JSON.parse(body.filesToDelete);
                } catch {
                    filesToDelete = [];
                }
            } else if (Array.isArray(body.filesToDelete)) {
                filesToDelete = body.filesToDelete;
            }
        }

        // Handle file uploads (similar to create)
        let orderOfProceedingFilename: string | undefined;
        const attachments: Array<{ fileName: string; fileUrl: string }> = [];

        // Handle orderOfProceeding file
        if (req.files && req.files.orderOfProceeding) {
            const file = Array.isArray(req.files.orderOfProceeding) 
                ? req.files.orderOfProceeding[0] 
                : req.files.orderOfProceeding;
            
            const validation = validateProceedingFile(file);
            if (!validation.valid) {
                return next(new HttpError(400, validation.error || 'Invalid file'));
            }

            try {
                orderOfProceedingFilename = await saveProceedingFile(file);
            } catch (error) {
                return next(new HttpError(500, `Failed to save file: ${error.message}`));
            }
        }

        // Handle attachment files for all proceeding types (same as create)
        if (req.files) {
            // Process Notice of Motion attachments
            const noticeOfMotionFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_noticeOfMotion_')
            );
            for (const key of noticeOfMotionFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    const indexMatch = key.match(/attachments_noticeOfMotion_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        if (body.noticeOfMotion) {
                            if (Array.isArray(body.noticeOfMotion)) {
                                if (body.noticeOfMotion[index]) {
                                    body.noticeOfMotion[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.noticeOfMotion.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process To File Reply attachments
            const replyTrackingFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_replyTracking_')
            );
            for (const key of replyTrackingFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    const indexMatch = key.match(/attachments_replyTracking_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        if (body.replyTracking) {
                            if (Array.isArray(body.replyTracking)) {
                                if (body.replyTracking[index]) {
                                    body.replyTracking[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.replyTracking.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Argument attachments
            const argumentFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_argumentDetails_')
            );
            for (const key of argumentFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    const indexMatch = key.match(/attachments_argumentDetails_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        if (body.argumentDetails) {
                            if (Array.isArray(body.argumentDetails)) {
                                if (body.argumentDetails[index]) {
                                    body.argumentDetails[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.argumentDetails.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Any Other attachments
            const anyOtherFiles = Object.keys(req.files).filter(key => 
                key.startsWith('attachments_anyOtherDetails_')
            );
            for (const key of anyOtherFiles) {
                const fileObj = req.files[key];
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || `Invalid file: ${key}`));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    const indexMatch = key.match(/attachments_anyOtherDetails_(\d+)/);
                    if (indexMatch) {
                        const index = parseInt(indexMatch[1], 10);
                        if (body.anyOtherDetails) {
                            if (Array.isArray(body.anyOtherDetails)) {
                                if (body.anyOtherDetails[index]) {
                                    body.anyOtherDetails[index].attachment = filename;
                                }
                            } else if (index === 0) {
                                body.anyOtherDetails.attachment = filename;
                            }
                        }
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save file ${key}: ${error.message}`));
                }
            }

            // Process Decision Details attachment
            if (req.files.attachments_decisionDetails) {
                const fileObj = req.files.attachments_decisionDetails;
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                
                const validation = validateProceedingFile(file);
                if (!validation.valid) {
                    return next(new HttpError(400, validation.error || 'Invalid decision details file'));
                }

                try {
                    const filename = await saveProceedingFile(file);
                    attachments.push({
                        fileName: file.name,
                        fileUrl: `/assets/proceedings/${filename}`
                    });
                    
                    if (body.decisionDetails) {
                        body.decisionDetails.attachment = filename;
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save decision details file: ${error.message}`));
                }
            }
        }

        // Add filename to body
        if (orderOfProceedingFilename) {
            body.orderOfProceedingFilename = orderOfProceedingFilename;
        }

        // Add attachments to body
        if (attachments.length > 0) {
            body.attachments = attachments;
        }

        const item: IProceedingModel = await ProceedingService.update(req.params.id, body, email, filesToDelete);
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


