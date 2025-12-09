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

        // Parse filesToDelete - comes as JSON string or array (needed before preserving attachments)
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

        // Fetch existing proceeding to preserve existing files
        const existingProceeding = await ProceedingService.findOne(req.params.id, email);
        if (!existingProceeding) {
            return next(new HttpError(404, 'Proceeding not found'));
        }

        // Preserve existing attachment filenames in proceeding type entries if not being replaced
        const preserveAttachmentInEntry = (existingEntry: any, newEntry: any, index: number) => {
            if (existingEntry && existingEntry.attachment && (!newEntry || !newEntry.attachment)) {
                // Only preserve if the file is not marked for deletion
                if (!filesToDelete.includes(existingEntry.attachment)) {
                    if (newEntry) {
                        newEntry.attachment = existingEntry.attachment;
                    }
                }
            }
        };

        // Preserve attachments in noticeOfMotion entries
        if (body.noticeOfMotion && existingProceeding.noticeOfMotion) {
            const existingEntries = Array.isArray(existingProceeding.noticeOfMotion) 
                ? existingProceeding.noticeOfMotion 
                : [existingProceeding.noticeOfMotion];
            const newEntries = Array.isArray(body.noticeOfMotion) 
                ? body.noticeOfMotion 
                : [body.noticeOfMotion];
            
            newEntries.forEach((newEntry: any, index: number) => {
                if (existingEntries[index]) {
                    preserveAttachmentInEntry(existingEntries[index], newEntry, index);
                }
            });
        }

        // Preserve attachments in replyTracking entries
        if (body.replyTracking && existingProceeding.replyTracking) {
            const existingEntries = Array.isArray(existingProceeding.replyTracking) 
                ? existingProceeding.replyTracking 
                : [existingProceeding.replyTracking];
            const newEntries = Array.isArray(body.replyTracking) 
                ? body.replyTracking 
                : [body.replyTracking];
            
            newEntries.forEach((newEntry: any, index: number) => {
                if (existingEntries[index]) {
                    preserveAttachmentInEntry(existingEntries[index], newEntry, index);
                }
            });
        }

        // Preserve attachments in argumentDetails entries
        if (body.argumentDetails && existingProceeding.argumentDetails) {
            const existingEntries = Array.isArray(existingProceeding.argumentDetails) 
                ? existingProceeding.argumentDetails 
                : [existingProceeding.argumentDetails];
            const newEntries = Array.isArray(body.argumentDetails) 
                ? body.argumentDetails 
                : [body.argumentDetails];
            
            newEntries.forEach((newEntry: any, index: number) => {
                if (existingEntries[index]) {
                    preserveAttachmentInEntry(existingEntries[index], newEntry, index);
                }
            });
        }

        // Preserve attachments in anyOtherDetails entries
        if (body.anyOtherDetails && existingProceeding.anyOtherDetails) {
            const existingEntries = Array.isArray(existingProceeding.anyOtherDetails) 
                ? existingProceeding.anyOtherDetails 
                : [existingProceeding.anyOtherDetails];
            const newEntries = Array.isArray(body.anyOtherDetails) 
                ? body.anyOtherDetails 
                : [body.anyOtherDetails];
            
            newEntries.forEach((newEntry: any, index: number) => {
                if (existingEntries[index]) {
                    preserveAttachmentInEntry(existingEntries[index], newEntry, index);
                }
            });
        }

        // Preserve attachment in decisionDetails
        if (body.decisionDetails && existingProceeding.decisionDetails) {
            if (existingProceeding.decisionDetails.attachment && !body.decisionDetails.attachment) {
                // Only preserve if the file is not marked for deletion
                if (!filesToDelete.includes(existingProceeding.decisionDetails.attachment)) {
                    body.decisionDetails.attachment = existingProceeding.decisionDetails.attachment;
                }
            }
        }

        // Handle file uploads (similar to create)
        let orderOfProceedingFilename: string | undefined;
        // Start with existing attachments, will merge with new ones
        const attachments: Array<{ fileName: string; fileUrl: string }> = existingProceeding.attachments ? [...existingProceeding.attachments] : [];
        
        // Track filenames that are being replaced (so we can remove old ones from attachments)
        const replacedFilenames: string[] = [];

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
                // If replacing orderOfProceeding, mark old filename for removal from attachments
                if (existingProceeding.orderOfProceedingFilename) {
                    replacedFilenames.push(existingProceeding.orderOfProceedingFilename);
                }
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
                            const existingEntries = Array.isArray(existingProceeding.noticeOfMotion) 
                                ? existingProceeding.noticeOfMotion 
                                : [existingProceeding.noticeOfMotion];
                            
                            // If replacing an existing attachment, mark old filename for removal
                            if (existingEntries[index] && existingEntries[index].attachment) {
                                replacedFilenames.push(existingEntries[index].attachment);
                            }
                            
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
                            const existingEntries = Array.isArray(existingProceeding.replyTracking) 
                                ? existingProceeding.replyTracking 
                                : [existingProceeding.replyTracking];
                            
                            // If replacing an existing attachment, mark old filename for removal
                            if (existingEntries[index] && existingEntries[index].attachment) {
                                replacedFilenames.push(existingEntries[index].attachment);
                            }
                            
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
                            const existingEntries = Array.isArray(existingProceeding.argumentDetails) 
                                ? existingProceeding.argumentDetails 
                                : [existingProceeding.argumentDetails];
                            
                            // If replacing an existing attachment, mark old filename for removal
                            if (existingEntries[index] && existingEntries[index].attachment) {
                                replacedFilenames.push(existingEntries[index].attachment);
                            }
                            
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
                            const existingEntries = Array.isArray(existingProceeding.anyOtherDetails) 
                                ? existingProceeding.anyOtherDetails 
                                : [existingProceeding.anyOtherDetails];
                            
                            // If replacing an existing attachment, mark old filename for removal
                            if (existingEntries[index] && existingEntries[index].attachment) {
                                replacedFilenames.push(existingEntries[index].attachment);
                            }
                            
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
                    
                    // If replacing an existing decision details attachment, mark old filename for removal
                    if (existingProceeding.decisionDetails && existingProceeding.decisionDetails.attachment) {
                        replacedFilenames.push(existingProceeding.decisionDetails.attachment);
                    }
                    
                    if (body.decisionDetails) {
                        body.decisionDetails.attachment = filename;
                    }
                } catch (error) {
                    return next(new HttpError(500, `Failed to save decision details file: ${error.message}`));
                }
            }
        }

        // Add filename to body (only if new file uploaded, otherwise preserve existing)
        if (orderOfProceedingFilename) {
            body.orderOfProceedingFilename = orderOfProceedingFilename;
        } else if (existingProceeding.orderOfProceedingFilename) {
            // Preserve existing orderOfProceedingFilename if no new file uploaded and not marked for deletion
            if (!filesToDelete.includes(existingProceeding.orderOfProceedingFilename)) {
                body.orderOfProceedingFilename = existingProceeding.orderOfProceedingFilename;
            }
        }

        // Merge existing attachments with new ones, or preserve existing if no new attachments
        // Filter out deleted files and replaced files from preserved attachments
        const allFilesToRemove = [...filesToDelete, ...replacedFilenames];
        if (attachments.length > 0) {
            // Remove deleted files and replaced files from attachments array
            body.attachments = attachments.filter(att => {
                const filename = att.fileUrl.replace('/assets/proceedings/', '');
                return !allFilesToRemove.includes(filename);
            });
        } else if (existingProceeding.attachments && existingProceeding.attachments.length > 0) {
            // Preserve existing attachments if no new attachments uploaded, but filter out deleted and replaced ones
            body.attachments = existingProceeding.attachments.filter(att => {
                const filename = att.fileUrl.replace('/assets/proceedings/', '');
                return !allFilesToRemove.includes(filename);
            });
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

export async function motionMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const metrics = await ProceedingService.motionMetrics(email);
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function affidavitMetrics(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const metrics = await ProceedingService.affidavitMetrics(email);
        res.status(200).json(metrics);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


