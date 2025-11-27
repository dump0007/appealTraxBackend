import * as Joi from 'joi';
import { Types } from 'mongoose';
import ProceedingModel, { IProceedingModel } from './model';
import ProceedingValidation from './validation';
import { IProceedingService } from './interface';

const ProceedingService: IProceedingService = {
    async findAll(email: string): Promise<IProceedingModel[]> {
        try {
            // Only return non-draft proceedings
            return await ProceedingModel.find({ email, draft: false })
                .sort({ fir: 1, sequence: 1 })
                .populate('fir')
                .populate('createdBy');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findByFIR(firId: string, email: string): Promise<IProceedingModel[]> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byFIR({ firId });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            // First verify the FIR belongs to this user
            const FIRModel = (await import('../FIR/model')).default;
            const fir = await FIRModel.findOne({ _id: new Types.ObjectId(firId), email });
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }
            // Only return non-draft proceedings
            return await ProceedingModel.find({ fir: new Types.ObjectId(firId), email, draft: false })
                .sort({ sequence: 1 })
                .populate('fir')
                .populate('createdBy');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string, email: string): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const proceeding = await ProceedingModel.findOne({ _id: new Types.ObjectId(id), email })
                .populate('fir')
                .populate('createdBy');
            if (!proceeding) {
                throw new Error('Proceeding not found or access denied');
            }
            return proceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findDraftByFIR(firId: string, email: string): Promise<IProceedingModel | null> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byFIR({ firId });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            // Verify the FIR belongs to this user
            const FIRModel = (await import('../FIR/model')).default;
            const fir = await FIRModel.findOne({ _id: new Types.ObjectId(firId), email });
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }
            return await ProceedingModel.findOne({ fir: new Types.ObjectId(firId), email, draft: true })
                .populate('fir')
                .populate('createdBy');
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
                const nextDate: any = body.replyTracking.nextDateOfHearing;
                if (nextDate === null || nextDate === undefined || 
                    (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                    body.replyTracking.nextDateOfHearing = undefined;
                }
            }
            if (body.argumentDetails) {
                const nextDate: any = body.argumentDetails.nextDateOfHearing;
                if (nextDate === null || nextDate === undefined || 
                    (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                    body.argumentDetails.nextDateOfHearing = undefined;
                }
                if (body.argumentDetails.details && typeof body.argumentDetails.details === 'string') {
                    body.argumentDetails.details = body.argumentDetails.details.trim();
                }
            }
            if (body.decisionDetails) {
                const decisionDate: any = body.decisionDetails.dateOfDecision;
                if (decisionDate === null || decisionDate === undefined || 
                    (typeof decisionDate === 'string' && String(decisionDate).trim() === '')) {
                    body.decisionDetails.dateOfDecision = undefined;
                }
            }
            
            // Ensure createdBy is set (controller should set it, but ensure it's there)
            if (!body.createdBy) {
                body.createdBy = new Types.ObjectId();
            }
            
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
            // Verify the FIR belongs to this user
            const FIRModel = (await import('../FIR/model')).default;
            const fir = await FIRModel.findOne({ _id: body.fir, email });
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }
            // Set email from token
            body.email = email;
            
            // If this is a draft, check if a draft already exists for this FIR
            if (body.draft) {
                const existingDraft = await ProceedingModel.findOne({ fir: body.fir, email, draft: true });
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
            
            return await ProceedingModel.create(body);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async remove(id: string, email: string): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const proceeding: IProceedingModel = await ProceedingModel.findOneAndRemove({ _id: new Types.ObjectId(id), email });
            if (!proceeding) {
                throw new Error('Proceeding not found or access denied');
            }
            return proceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default ProceedingService;


