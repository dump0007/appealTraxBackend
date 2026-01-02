import * as Joi from 'joi';
import { Types } from 'mongoose';
import ProceedingModel, { IProceedingModel } from './model';
import ProceedingValidation from './validation';
import { IProceedingService } from './interface';

const ProceedingService: IProceedingService = {
    async findAll(email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel[]> {
        try {
            if (isAdmin) {
                // Admin can see all non-draft proceedings
                return await ProceedingModel.find({ draft: false })
                    .sort({ fir: 1, sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            } else if (branch) {
                // Regular user: get all FIRs in their branch, then get proceedings for those FIRs
                const FIRModel = (await import('../FIR/model')).default;
                const firs = await FIRModel.find({
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                }).select('_id');
                const firIds = firs.map(f => f._id);
                
                return await ProceedingModel.find({ 
                    fir: { $in: firIds },
                    draft: false 
                })
                    .sort({ fir: 1, sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            } else {
                // Fallback: filter by email
                return await ProceedingModel.find({ email, draft: false })
                    .sort({ fir: 1, sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findByFIR(firId: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel[]> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byFIR({ firId });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            // Verify the FIR belongs to user's branch (or allow admin to view any FIR)
            const FIRModel = (await import('../FIR/model')).default;
            let fir;
            if (isAdmin) {
                // Admin can view proceedings for any FIR
                fir = await FIRModel.findById(new Types.ObjectId(firId));
                if (!fir) {
                    throw new Error('FIR not found');
                }
            } else if (branch) {
                // Regular user: verify FIR belongs to their branch
                fir = await FIRModel.findOne({
                    _id: new Types.ObjectId(firId),
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
            } else {
                // Fallback: verify FIR ownership by email
                fir = await FIRModel.findOne({ _id: new Types.ObjectId(firId), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
            }
            
            // Only return non-draft proceedings
            if (isAdmin || branch) {
                // Admin or branch-based access: show all proceedings for this FIR
                return await ProceedingModel.find({ fir: new Types.ObjectId(firId), draft: false })
                    .sort({ sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            } else {
                // Fallback: filter by email
                return await ProceedingModel.find({ fir: new Types.ObjectId(firId), email, draft: false })
                    .sort({ sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            let proceeding;
            if (isAdmin) {
                // Admin can view any proceeding
                proceeding = await ProceedingModel.findById(new Types.ObjectId(id))
                    .populate('fir')
                    .populate('createdBy');
                if (!proceeding) {
                    throw new Error('Proceeding not found');
                }
            } else if (branch) {
                // Regular user: verify proceeding's FIR belongs to their branch
                proceeding = await ProceedingModel.findById(new Types.ObjectId(id))
                    .populate('fir')
                    .populate('createdBy');
                if (!proceeding) {
                    throw new Error('Proceeding not found');
                }
                // Check if FIR belongs to user's branch
                const fir = proceeding.fir as any;
                const firBranch = fir?.branchName || fir?.branch;
                if (firBranch !== branch) {
                    throw new Error('Proceeding not found or access denied');
                }
            } else {
                // Fallback: verify ownership by email
                proceeding = await ProceedingModel.findOne({ _id: new Types.ObjectId(id), email })
                    .populate('fir')
                    .populate('createdBy');
                if (!proceeding) {
                    throw new Error('Proceeding not found or access denied');
                }
            }
            return proceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findDraftByFIR(firId: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel | null> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byFIR({ firId });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            // Verify the FIR belongs to user's branch (or allow admin to view any FIR)
            const FIRModel = (await import('../FIR/model')).default;
            let fir;
            if (isAdmin) {
                // Admin can view drafts for any FIR
                fir = await FIRModel.findById(new Types.ObjectId(firId));
                if (!fir) {
                    throw new Error('FIR not found');
                }
            } else if (branch) {
                // Regular user: verify FIR belongs to their branch
                fir = await FIRModel.findOne({
                    _id: new Types.ObjectId(firId),
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
            } else {
                // Fallback: verify FIR ownership by email
                fir = await FIRModel.findOne({ _id: new Types.ObjectId(firId), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
            }
            
            if (isAdmin || branch) {
                // Admin or branch-based access: show any draft for this FIR
                return await ProceedingModel.findOne({ fir: new Types.ObjectId(firId), draft: true })
                    .populate('fir')
                    .populate('createdBy');
            } else {
                // Fallback: filter by email
                return await ProceedingModel.findOne({ fir: new Types.ObjectId(firId), email, draft: true })
                    .populate('fir')
                    .populate('createdBy');
            }
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async insert(body: IProceedingModel, email: string): Promise<IProceedingModel> {
        try {
            // Clean up empty date strings and empty objects before validation
            // Handle both single object and array of noticeOfMotion
            if (body.noticeOfMotion) {
                const cleanNoticeOfMotion = (notice: any) => {
                    if (!notice) return notice;
                    // Preserve attachment field before cleaning
                    const attachment = notice.attachment;
                // Clean up empty date strings (handle both Date and string types)
                    const nextDate: any = notice.nextDateOfHearing;
                if (nextDate === null || nextDate === undefined || 
                    (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        notice.nextDateOfHearing = undefined;
                }
                    const replyDate: any = notice.replyFilingDate;
                if (replyDate === null || replyDate === undefined || 
                    (typeof replyDate === 'string' && String(replyDate).trim() === '')) {
                        notice.replyFilingDate = undefined;
                }
                // Clean up empty person objects (if name is empty or missing)
                    if (notice.formatFilledBy) {
                        if (!notice.formatFilledBy.name || notice.formatFilledBy.name.trim() === '') {
                            notice.formatFilledBy = undefined;
                    }
                }
                    if (notice.appearingAG) {
                        if (!notice.appearingAG.name || notice.appearingAG.name.trim() === '') {
                            notice.appearingAG = undefined;
                    }
                }
                    if (notice.attendingOfficer) {
                        if (!notice.attendingOfficer.name || notice.attendingOfficer.name.trim() === '') {
                            notice.attendingOfficer = undefined;
                        }
                    }
                    if (notice.investigatingOfficer) {
                        if (!notice.investigatingOfficer.name || notice.investigatingOfficer.name.trim() === '') {
                            notice.investigatingOfficer = undefined;
                        }
                    }
                    // Restore attachment field after cleaning
                    if (attachment !== undefined) {
                        notice.attachment = attachment;
                    }
                    console.log(`[ProceedingService] cleanNoticeOfMotion - attachment preserved: ${attachment}`);
                    return notice;
                };

                if (Array.isArray(body.noticeOfMotion)) {
                    body.noticeOfMotion = body.noticeOfMotion.map(cleanNoticeOfMotion);
                } else {
                    body.noticeOfMotion = cleanNoticeOfMotion(body.noticeOfMotion);
                }
            }
            
            // Clean up dates in other sections
            if (body.replyTracking) {
                if (Array.isArray(body.replyTracking)) {
                    body.replyTracking = body.replyTracking.map((entry: any) => {
                        // Preserve attachment field before cleaning
                        const attachment = entry.attachment;
                        if (entry.nextDateOfHearingReply === null || entry.nextDateOfHearingReply === undefined || 
                            (typeof entry.nextDateOfHearingReply === 'string' && String(entry.nextDateOfHearingReply).trim() === '')) {
                            entry.nextDateOfHearingReply = undefined;
                        }
                        // Restore attachment field after cleaning
                        if (attachment !== undefined) {
                            entry.attachment = attachment;
                        }
                        console.log(`[ProceedingService] replyTracking entry - attachment preserved: ${attachment}`);
                        return entry;
                    });
                } else {
                    // Preserve attachment field before cleaning
                    const attachment = (body.replyTracking as any).attachment;
                    const nextDate: any = (body.replyTracking as any).nextDateOfHearingReply;
                    if (nextDate === null || nextDate === undefined || 
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        (body.replyTracking as any).nextDateOfHearingReply = undefined;
                    }
                    // Restore attachment field after cleaning
                    if (attachment !== undefined) {
                        (body.replyTracking as any).attachment = attachment;
                    }
                    console.log(`[ProceedingService] replyTracking (single) - attachment preserved: ${attachment}`);
                }
            }
            if (body.argumentDetails) {
                // Handle both single object and array formats
                if (Array.isArray(body.argumentDetails)) {
                    (body.argumentDetails as any) = body.argumentDetails.map((entry: any) => {
                        // Preserve attachment field before cleaning
                        const attachment = entry.attachment;
                        const nextDate: any = entry.nextDateOfHearing;
                        if (nextDate === null || nextDate === undefined || 
                            (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                            entry.nextDateOfHearing = undefined;
                        }
                        if (entry.argumentBy && typeof entry.argumentBy === 'string') {
                            entry.argumentBy = entry.argumentBy.trim();
                        }
                        if (entry.argumentWith && typeof entry.argumentWith === 'string') {
                            entry.argumentWith = entry.argumentWith.trim();
                        }
                        // Restore attachment field after cleaning
                        if (attachment !== undefined) {
                            entry.attachment = attachment;
                        }
                        console.log(`[ProceedingService] argumentDetails entry - attachment preserved: ${attachment}`);
                        return entry;
                    });
                } else {
                    // Preserve attachment field before cleaning
                    const attachment = (body.argumentDetails as any).attachment;
                    const nextDate: any = (body.argumentDetails as any).nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined || 
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        (body.argumentDetails as any).nextDateOfHearing = undefined;
                    }
                    if ((body.argumentDetails as any).argumentBy && typeof (body.argumentDetails as any).argumentBy === 'string') {
                        (body.argumentDetails as any).argumentBy = (body.argumentDetails as any).argumentBy.trim();
                    }
                    if ((body.argumentDetails as any).argumentWith && typeof (body.argumentDetails as any).argumentWith === 'string') {
                        (body.argumentDetails as any).argumentWith = (body.argumentDetails as any).argumentWith.trim();
                    }
                    // Restore attachment field after cleaning
                    if (attachment !== undefined) {
                        (body.argumentDetails as any).attachment = attachment;
                    }
                    console.log(`[ProceedingService] argumentDetails (single) - attachment preserved: ${attachment}`);
                }
            }
            // Clean up anyOtherDetails if present
            if (body.anyOtherDetails) {
                // No date fields to clean up for anyOtherDetails, but ensure attachment fields are preserved
                if (Array.isArray(body.anyOtherDetails)) {
                    body.anyOtherDetails = body.anyOtherDetails.map((entry: any) => {
                        // Explicitly preserve attachment field
                        const attachment = entry.attachment;
                        console.log(`[ProceedingService] anyOtherDetails entry - attachment preserved: ${attachment}`);
                        // Return entry as-is (no cleaning needed, but ensure attachment is preserved)
                        if (attachment !== undefined && !entry.attachment) {
                            entry.attachment = attachment;
                        }
                        return entry;
                    });
                } else {
                    // Explicitly preserve attachment field for single object
                    const attachment = (body.anyOtherDetails as any).attachment;
                    console.log(`[ProceedingService] anyOtherDetails (single) - attachment preserved: ${attachment}`);
                    if (attachment !== undefined && !(body.anyOtherDetails as any).attachment) {
                        (body.anyOtherDetails as any).attachment = attachment;
                    }
                }
            }
            
            // Clean up decisionDetails if present
            if (body.decisionDetails) {
                // Preserve attachment field before cleaning
                const attachment = body.decisionDetails.attachment;
                const decisionDate: any = body.decisionDetails.dateOfDecision;
                if (decisionDate === null || decisionDate === undefined || 
                    (typeof decisionDate === 'string' && String(decisionDate).trim() === '')) {
                    body.decisionDetails.dateOfDecision = undefined;
                }
                // Trim string fields
                if (body.decisionDetails.decisionByCourt && typeof body.decisionDetails.decisionByCourt === 'string') {
                    body.decisionDetails.decisionByCourt = body.decisionDetails.decisionByCourt.trim();
                }
                if (body.decisionDetails.remarks && typeof body.decisionDetails.remarks === 'string') {
                    body.decisionDetails.remarks = body.decisionDetails.remarks.trim();
                }
                // Restore attachment field after cleaning
                if (attachment !== undefined) {
                    body.decisionDetails.attachment = attachment;
                }
                console.log(`[ProceedingService] decisionDetails - attachment preserved: ${attachment}`);
            }
            
            // Ensure createdBy is set (controller should set it, but ensure it's there)
            if (!body.createdBy) {
                body.createdBy = new Types.ObjectId();
            }
            
            // Debug logging: Log attachment fields before validation
            console.log(`[ProceedingService] Before validation - noticeOfMotion attachments:`, 
                body.noticeOfMotion ? (Array.isArray(body.noticeOfMotion) 
                    ? body.noticeOfMotion.map((n: any) => n?.attachment).filter(Boolean)
                    : [body.noticeOfMotion?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] Before validation - replyTracking attachments:`, 
                body.replyTracking ? (Array.isArray(body.replyTracking) 
                    ? body.replyTracking.map((r: any) => r?.attachment).filter(Boolean)
                    : [body.replyTracking?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] Before validation - argumentDetails attachments:`, 
                body.argumentDetails ? (Array.isArray(body.argumentDetails) 
                    ? body.argumentDetails.map((a: any) => a?.attachment).filter(Boolean)
                    : [body.argumentDetails?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] Before validation - anyOtherDetails attachments:`, 
                body.anyOtherDetails ? (Array.isArray(body.anyOtherDetails) 
                    ? body.anyOtherDetails.map((a: any) => a?.attachment).filter(Boolean)
                    : [body.anyOtherDetails?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] Before validation - decisionDetails attachment:`, body.decisionDetails?.attachment);
            
            const validationPayload: any = {
                ...body,
                createdBy: typeof body.createdBy === 'string'
                    ? body.createdBy
                    : (body.createdBy as Types.ObjectId).toHexString(),
            };
            
            const validate: Joi.ValidationResult = ProceedingValidation.create(validationPayload);
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            // Check if user is admin
            const UserModel = (await import('../User/model')).default;
            const user = await UserModel.findOne({ email });
            const isAdmin = user && user.role === 'ADMIN';
            
            // Verify the FIR belongs to this user (or allow admin to create for any FIR)
            const FIRModel = (await import('../FIR/model')).default;
            let fir;
            if (isAdmin) {
                // Admin can create proceedings for any FIR
                fir = await FIRModel.findById(body.fir);
                if (!fir) {
                    throw new Error('FIR not found');
                }
                // Associate proceeding with FIR owner's email (not admin's email)
                body.email = fir.email;
            } else {
                // Regular user: verify FIR ownership
                fir = await FIRModel.findOne({ _id: body.fir, email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                // Set email from token
                body.email = email;
            }
            
            // If this is a draft, check if a draft already exists for this FIR
            // Use body.email (which is set to FIR owner's email for admin, or user's email for regular user)
            if (body.draft) {
                const existingDraft = await ProceedingModel.findOne({ fir: body.fir, email: body.email, draft: true });
                if (existingDraft) {
                    // Update existing draft
                    Object.assign(existingDraft, body);
                    await existingDraft.save();
                    return existingDraft;
                }
            } else {
                // If finalizing a draft, delete any existing draft and create final proceeding
                await ProceedingModel.deleteOne({ fir: body.fir, email, draft: true });
                // Set proper sequence for final proceeding
                const last = await ProceedingModel.findOne({ fir: body.fir, draft: false }).sort({ sequence: -1 }).select('sequence').lean();
                body.sequence = last && typeof last.sequence === 'number' ? last.sequence + 1 : 1;
            }
            
            const proceeding = await ProceedingModel.create(body);
            
            // Debug logging - log the actual proceeding that was created
            console.log(`[ProceedingService] Proceeding created with ID: ${proceeding._id}`);
            console.log(`[ProceedingService] Proceeding draft flag: ${proceeding.draft} (body.draft was: ${body.draft})`);
            console.log(`[ProceedingService] Proceeding decisionDetails:`, JSON.stringify(proceeding.decisionDetails));
            console.log(`[ProceedingService] Body decisionDetails:`, JSON.stringify(body.decisionDetails));
            
            // Debug logging: Log attachment fields after model creation
            console.log(`[ProceedingService] After creation - noticeOfMotion attachments:`, 
                proceeding.noticeOfMotion ? (Array.isArray(proceeding.noticeOfMotion) 
                    ? proceeding.noticeOfMotion.map((n: any) => n?.attachment).filter(Boolean)
                    : [proceeding.noticeOfMotion?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] After creation - replyTracking attachments:`, 
                proceeding.replyTracking ? (Array.isArray(proceeding.replyTracking) 
                    ? proceeding.replyTracking.map((r: any) => r?.attachment).filter(Boolean)
                    : [proceeding.replyTracking?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] After creation - argumentDetails attachments:`, 
                proceeding.argumentDetails ? (Array.isArray(proceeding.argumentDetails) 
                    ? proceeding.argumentDetails.map((a: any) => a?.attachment).filter(Boolean)
                    : [proceeding.argumentDetails?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] After creation - anyOtherDetails attachments:`, 
                proceeding.anyOtherDetails ? (Array.isArray(proceeding.anyOtherDetails) 
                    ? proceeding.anyOtherDetails.map((a: any) => a?.attachment).filter(Boolean)
                    : [proceeding.anyOtherDetails?.attachment].filter(Boolean)) : []);
            console.log(`[ProceedingService] After creation - decisionDetails attachment:`, proceeding.decisionDetails?.attachment);
            
            // Update FIR status if proceeding has decisionDetails with writStatus
            // Only update for non-draft (final) proceedings
            // Check if writStatus exists and is not empty
            const writStatus = body.decisionDetails?.writStatus;
            const hasWritStatus = writStatus && 
                                  (typeof writStatus === 'string' ? writStatus.trim() !== '' : true);
            
            console.log(`[ProceedingService] Checking FIR update conditions: draft=${body.draft}, proceeding.draft=${proceeding.draft}, hasDecisionDetails=${!!body.decisionDetails}, writStatus=${writStatus}, hasWritStatus=${hasWritStatus}`);
            
            if (!body.draft && body.decisionDetails && hasWritStatus) {
                try {
                    const updateResult = await FIRModel.updateOne(
                        { _id: body.fir, email },
                        { $set: { status: writStatus } }
                    );
                    console.log(`[ProceedingService] Updated FIR ${body.fir} status to ${writStatus}. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
                    
                    if (updateResult.matchedCount === 0) {
                        console.warn(`[ProceedingService] FIR ${body.fir} not found or email mismatch (email: ${email}). Attempting update without email filter...`);
                        // Try updating without email filter (in case FIR was created by different user or email mismatch)
                        const updateResultNoEmail = await FIRModel.updateOne(
                            { _id: body.fir },
                            { $set: { status: writStatus } }
                        );
                        console.log(`[ProceedingService] Update without email filter: Matched: ${updateResultNoEmail.matchedCount}, Modified: ${updateResultNoEmail.modifiedCount}`);
                    }
                } catch (updateError) {
                    console.error(`[ProceedingService] Error updating FIR status:`, updateError);
                    // Don't throw - proceeding was created successfully, just log the error
                }
            } else {
                // Log why FIR status wasn't updated
                if (body.draft) {
                    console.log(`[ProceedingService] Skipping FIR status update - proceeding is a draft`);
                } else if (!body.decisionDetails) {
                    console.log(`[ProceedingService] Skipping FIR status update - no decisionDetails in proceeding`);
                } else if (!hasWritStatus) {
                    console.log(`[ProceedingService] Skipping FIR status update - writStatus is empty or invalid. decisionDetails:`, JSON.stringify(body.decisionDetails));
                }
            }
            
            return proceeding;
        } catch (error) {
            console.log("ERROR ->",error);
            
            throw new Error(error.message);
        }
    },

    async update(id: string, body: IProceedingModel, email: string, filesToDelete?: string[], branch?: string, isAdmin?: boolean): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }

            // Find existing proceeding
            let existingProceeding;
            if (isAdmin) {
                existingProceeding = await ProceedingModel.findById(new Types.ObjectId(id));
            } else if (branch) {
                existingProceeding = await ProceedingModel.findById(new Types.ObjectId(id));
                if (existingProceeding) {
                    // Verify proceeding's FIR belongs to user's branch
                    const FIRModel = (await import('../FIR/model')).default;
                    const fir = await FIRModel.findById(existingProceeding.fir);
                    if (!fir || (fir.branchName !== branch && fir.branch !== branch)) {
                        throw new Error('Proceeding not found or access denied');
                    }
                }
            } else {
                existingProceeding = await ProceedingModel.findOne({ _id: new Types.ObjectId(id), email });
            }
            
            if (!existingProceeding) {
                throw new Error('Proceeding not found or access denied');
            }

            // Verify FIR is completed (has non-draft proceedings)
            const FIRModel = (await import('../FIR/model')).default;
            let fir;
            if (isAdmin) {
                fir = await FIRModel.findById(existingProceeding.fir);
            } else if (branch) {
                fir = await FIRModel.findOne({
                    _id: existingProceeding.fir,
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                });
            } else {
                fir = await FIRModel.findOne({ _id: existingProceeding.fir, email });
            }
            
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }

            // Check if FIR has completed proceedings
            let allProceedings;
            if (isAdmin || branch) {
                allProceedings = await ProceedingModel.find({ fir: existingProceeding.fir, draft: false });
            } else {
                allProceedings = await ProceedingModel.find({ fir: existingProceeding.fir, email, draft: false });
            }
            const hasCompletedProceedings = allProceedings.length > 0 && allProceedings.some(p => !p.draft);
            if (!hasCompletedProceedings) {
                throw new Error('Cannot edit proceeding: FIR must be fully completed before editing');
            }

            // Clean up empty date strings and empty objects before validation (same as insert)
            if (body.noticeOfMotion) {
                const cleanNoticeOfMotion = (notice: any) => {
                    if (!notice) return notice;
                    const nextDate: any = notice.nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined || 
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        notice.nextDateOfHearing = undefined;
                    }
                    const replyDate: any = notice.replyFilingDate;
                    if (replyDate === null || replyDate === undefined || 
                        (typeof replyDate === 'string' && String(replyDate).trim() === '')) {
                        notice.replyFilingDate = undefined;
                    }
                    if (notice.formatFilledBy) {
                        if (!notice.formatFilledBy.name || notice.formatFilledBy.name.trim() === '') {
                            notice.formatFilledBy = undefined;
                        }
                    }
                    if (notice.appearingAG) {
                        if (!notice.appearingAG.name || notice.appearingAG.name.trim() === '') {
                            notice.appearingAG = undefined;
                        }
                    }
                    if (notice.attendingOfficer) {
                        if (!notice.attendingOfficer.name || notice.attendingOfficer.name.trim() === '') {
                            notice.attendingOfficer = undefined;
                        }
                    }
                    if (notice.investigatingOfficer) {
                        if (!notice.investigatingOfficer.name || notice.investigatingOfficer.name.trim() === '') {
                            notice.investigatingOfficer = undefined;
                        }
                    }
                    return notice;
                };

                if (Array.isArray(body.noticeOfMotion)) {
                    body.noticeOfMotion = body.noticeOfMotion.map(cleanNoticeOfMotion);
                } else {
                    body.noticeOfMotion = cleanNoticeOfMotion(body.noticeOfMotion);
                }
            }

            if (body.replyTracking) {
                if (Array.isArray(body.replyTracking)) {
                    body.replyTracking = body.replyTracking.map((entry: any) => {
                        if (entry.nextDateOfHearingReply === null || entry.nextDateOfHearingReply === undefined || 
                            (typeof entry.nextDateOfHearingReply === 'string' && String(entry.nextDateOfHearingReply).trim() === '')) {
                            entry.nextDateOfHearingReply = undefined;
                        }
                        return entry;
                    });
                } else {
                    const nextDate: any = (body.replyTracking as any).nextDateOfHearingReply;
                    if (nextDate === null || nextDate === undefined || 
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        (body.replyTracking as any).nextDateOfHearingReply = undefined;
                    }
                }
            }

            if (body.argumentDetails) {
                if (Array.isArray(body.argumentDetails)) {
                    (body.argumentDetails as any) = body.argumentDetails.map((entry: any) => {
                        const nextDate: any = entry.nextDateOfHearing;
                        if (nextDate === null || nextDate === undefined || 
                            (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                            entry.nextDateOfHearing = undefined;
                        }
                        if (entry.argumentBy && typeof entry.argumentBy === 'string') {
                            entry.argumentBy = entry.argumentBy.trim();
                        }
                        if (entry.argumentWith && typeof entry.argumentWith === 'string') {
                            entry.argumentWith = entry.argumentWith.trim();
                        }
                        return entry;
                    });
                } else {
                    const nextDate: any = (body.argumentDetails as any).nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined || 
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        (body.argumentDetails as any).nextDateOfHearing = undefined;
                    }
                    if ((body.argumentDetails as any).argumentBy && typeof (body.argumentDetails as any).argumentBy === 'string') {
                        (body.argumentDetails as any).argumentBy = (body.argumentDetails as any).argumentBy.trim();
                    }
                    if ((body.argumentDetails as any).argumentWith && typeof (body.argumentDetails as any).argumentWith === 'string') {
                        (body.argumentDetails as any).argumentWith = (body.argumentDetails as any).argumentWith.trim();
                    }
                }
            }

            if (body.decisionDetails) {
                const decisionDate: any = body.decisionDetails.dateOfDecision;
                if (decisionDate === null || decisionDate === undefined || 
                    (typeof decisionDate === 'string' && String(decisionDate).trim() === '')) {
                    body.decisionDetails.dateOfDecision = undefined;
                }
                if (body.decisionDetails.decisionByCourt && typeof body.decisionDetails.decisionByCourt === 'string') {
                    body.decisionDetails.decisionByCourt = body.decisionDetails.decisionByCourt.trim();
                }
                if (body.decisionDetails.remarks && typeof body.decisionDetails.remarks === 'string') {
                    body.decisionDetails.remarks = body.decisionDetails.remarks.trim();
                }
            }

            const validationPayload: any = {
                ...body,
                createdBy: typeof existingProceeding.createdBy === 'string'
                    ? existingProceeding.createdBy
                    : (existingProceeding.createdBy as Types.ObjectId).toHexString(),
            };

            const updateValidate: Joi.ValidationResult = ProceedingValidation.create(validationPayload);
            if (updateValidate.error) {
                throw new Error(updateValidate.error.message);
            }

            // Verify the FIR belongs to this user
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }

            // Don't update email, fir, sequence, or createdBy
            const updateData: any = {
                type: body.type,
                summary: body.summary,
                details: body.details,
                hearingDetails: body.hearingDetails,
                noticeOfMotion: body.noticeOfMotion,
                replyTracking: body.replyTracking,
                argumentDetails: body.argumentDetails,
                anyOtherDetails: body.anyOtherDetails,
                decisionDetails: body.decisionDetails,
            };

            // Only update attachments if explicitly provided, otherwise preserve existing
            if (body.attachments !== undefined) {
                updateData.attachments = body.attachments;
            }

            // Only update orderOfProceedingFilename if explicitly provided, otherwise preserve existing
            if (body.orderOfProceedingFilename !== undefined) {
                updateData.orderOfProceedingFilename = body.orderOfProceedingFilename;
            }

            // Update proceeding
            let query: any = { _id: new Types.ObjectId(id) };
            if (!isAdmin && !branch) {
                // Fallback: filter by email
                query.email = email;
            }
            
            const updatedProceeding = await ProceedingModel.findOneAndUpdate(
                query,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedProceeding) {
                throw new Error('Proceeding not found or access denied');
            }

            // Delete old files if provided
            if (filesToDelete && filesToDelete.length > 0) {
                const { deleteProceedingFile } = await import('../../config/middleware/fileUpload');
                for (const filename of filesToDelete) {
                    try {
                        deleteProceedingFile(filename);
                        console.log(`[ProceedingService] Deleted file: ${filename}`);
                    } catch (fileError) {
                        console.error(`[ProceedingService] Error deleting file ${filename}:`, fileError);
                        // Don't throw - file deletion failure shouldn't fail the update
                    }
                }
            }

            // Update FIR status if proceeding has decisionDetails with writStatus
            const writStatus = body.decisionDetails?.writStatus;
            const hasWritStatus = writStatus && 
                                  (typeof writStatus === 'string' ? writStatus.trim() !== '' : true);

            if (body.decisionDetails && hasWritStatus) {
                try {
                    const updateResult = await FIRModel.updateOne(
                        { _id: existingProceeding.fir, email },
                        { $set: { status: writStatus } }
                    );
                    console.log(`[ProceedingService] Updated FIR ${existingProceeding.fir} status to ${writStatus}. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
                } catch (updateError) {
                    console.error(`[ProceedingService] Error updating FIR status:`, updateError);
                    // Don't throw - proceeding was updated successfully, just log the error
                }
            }

            return updatedProceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async remove(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            // Verify proceeding access
            let proceeding;
            if (isAdmin) {
                proceeding = await ProceedingModel.findById(new Types.ObjectId(id));
            } else if (branch) {
                proceeding = await ProceedingModel.findById(new Types.ObjectId(id));
                if (proceeding) {
                    // Verify proceeding's FIR belongs to user's branch
                    const FIRModel = (await import('../FIR/model')).default;
                    const fir = await FIRModel.findById(proceeding.fir);
                    if (!fir || (fir.branchName !== branch && fir.branch !== branch)) {
                        throw new Error('Proceeding not found or access denied');
                    }
                }
            } else {
                proceeding = await ProceedingModel.findOne({ _id: new Types.ObjectId(id), email });
            }
            
            if (!proceeding) {
                throw new Error('Proceeding not found or access denied');
            }
            
            // Use the proceeding we already found and verified
            const deletedProceeding = await ProceedingModel.findOneAndRemove({ _id: new Types.ObjectId(id) });
            if (!deletedProceeding) {
                throw new Error('Proceeding not found or access denied');
            }
            return deletedProceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async motionMetrics(email: string): Promise<{ filed: number, pending: number, overdue: number }> {
        try {
            const now = new Date();
            
            // Get all filed motions (draft: false AND type: 'NOTICE_OF_MOTION')
            const filedMotions = await ProceedingModel.find({
                email,
                type: 'NOTICE_OF_MOTION',
                draft: false
            });

            let pending = 0;
            let overdue = 0;

            // For each filed motion, check hearing date
            for (const motion of filedMotions) {
                if (motion.hearingDetails && motion.hearingDetails.dateOfHearing) {
                    const hearingDate = new Date(motion.hearingDetails.dateOfHearing);
                    if (hearingDate > now) {
                        pending++;
                    } else if (hearingDate < now) {
                        overdue++;
                    }
                }
            }

            return {
                filed: filedMotions.length,
                pending,
                overdue
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async affidavitMetrics(email: string): Promise<{ filed: number, pending: number, overdue: number }> {
        try {
            const now = new Date();
            
            // Get all filed affidavits (draft: false AND type: 'TO_FILE_REPLY')
            const filedAffidavits = await ProceedingModel.find({
                email,
                type: 'TO_FILE_REPLY',
                draft: false
            });

            let pending = 0;
            let overdue = 0;

            // For each filed affidavit, check hearing date
            for (const affidavit of filedAffidavits) {
                let hearingDate: Date | null = null;
                
                // Check replyTracking.nextDateOfHearingReply first (specific to TO_FILE_REPLY)
                if (affidavit.replyTracking) {
                    const replyTracking = Array.isArray(affidavit.replyTracking) 
                        ? affidavit.replyTracking[0] 
                        : affidavit.replyTracking;
                    if (replyTracking && replyTracking.nextDateOfHearingReply) {
                        hearingDate = new Date(replyTracking.nextDateOfHearingReply);
                    }
                }
                
                // Fallback to hearingDetails.dateOfHearing if nextDateOfHearingReply is not available
                if (!hearingDate && affidavit.hearingDetails && affidavit.hearingDetails.dateOfHearing) {
                    hearingDate = new Date(affidavit.hearingDetails.dateOfHearing);
                }
                
                if (hearingDate) {
                    if (hearingDate > now) {
                        pending++;
                    } else if (hearingDate < now) {
                        overdue++;
                    }
                }
            }

            return {
                filed: filedAffidavits.length,
                pending,
                overdue
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default ProceedingService;


