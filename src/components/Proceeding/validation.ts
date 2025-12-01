import * as Joi from 'joi';
import Validation from '../validation';
import { IProceedingModel } from './model';

class ProceedingValidation extends Validation {
    constructor() {
        super();
    }

    create(body: IProceedingModel): Joi.ValidationResult {
        const personSchema = Joi.object({
            name: Joi.string().trim().required(),
            rank: Joi.string().trim().allow('', null),
            mobile: Joi.string().trim().allow('', null),
        }).allow(null);

        const personSchemaOptional = Joi.object({
            name: Joi.string().trim().allow('', null),
            rank: Joi.string().trim().allow('', null),
            mobile: Joi.string().trim().allow('', null),
        }).allow(null);

        const hearingDetailsSchema = Joi.object({
            dateOfHearing: Joi.date().required(),
            judgeName: Joi.string().trim().required(),
            courtNumber: Joi.string().trim().required(),
        });

        // Schema for NOTICE_OF_MOTION type only
        const noticeOfMotionSchema = Joi.object({
            attendanceMode: Joi.string().valid('BY_FORMAT', 'BY_PERSON').required(),
            formatSubmitted: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: Joi.boolean().required(),
                otherwise: Joi.boolean().allow(null).optional(),
            }),
            formatFilledBy: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: personSchema.required(),
                otherwise: personSchemaOptional,
            }),
            appearingAG: personSchemaOptional, // Legacy
            appearingAGDetails: Joi.when('attendanceMode', {
                is: 'BY_PERSON',
                then: Joi.string().trim().required(),
                otherwise: Joi.string().trim().allow('', null).optional(),
            }),
            aagDgWhoWillAppear: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: Joi.string().trim().required(),
                otherwise: Joi.string().trim().allow('', null).optional(),
            }),
            attendingOfficer: personSchemaOptional, // Legacy
            attendingOfficerDetails: Joi.when('attendanceMode', {
                is: 'BY_PERSON',
                then: Joi.string().trim().required(),
                otherwise: Joi.string().trim().allow('', null).optional(),
            }),
            investigatingOfficer: Joi.when('attendanceMode', {
                is: 'BY_PERSON',
                then: personSchema.required(),
                otherwise: personSchemaOptional,
            }),
            details: Joi.string().trim().required(), // Details of proceeding
            attachment: Joi.string().trim().allow('', null), // Filename of the attached document for this record
        }).unknown(false);

        // Schema for TO_FILE_REPLY type only
        const toFileReplySchema = Joi.object({
            officerDeputedForReply: Joi.string().trim().allow('', null),
            vettingOfficerDetails: Joi.string().trim().allow('', null),
            replyFiled: Joi.boolean().allow(null),
            replyFilingDate: Joi.when('replyFiled', {
                is: true,
                then: Joi.alternatives().try(
                    Joi.date().required(),
                    Joi.string().trim().required().custom((value, helpers) => {
                        if (!value || value === '') {
                            return helpers.error('any.required');
                        }
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                    })
                ),
                otherwise: Joi.alternatives().try(
                    Joi.date().allow(null),
                    Joi.string().allow('', null).custom((value, helpers) => {
                        if (!value || value === '') return null;
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                    })
                ),
            }),
            advocateGeneralName: Joi.string().trim().allow('', null),
            replyScrutinizedByHC: Joi.boolean().allow(null),
            investigatingOfficerName: Joi.string().trim().allow('', null),
            proceedingInCourt: Joi.string().trim().allow('', null),
            orderInShort: Joi.string().trim().allow('', null),
            nextActionablePoint: Joi.string().trim().allow('', null),
            nextDateOfHearingReply: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
            attachment: Joi.string().trim().allow('', null), // Filename of the attached document for this record
        }).unknown(false);

        const replyTrackingSchema = Joi.object({
            proceedingInCourt: Joi.string().trim().allow('', null),
            orderInShort: Joi.string().trim().allow('', null),
            nextActionablePoint: Joi.string().trim().allow('', null),
            nextDateOfHearing: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
        }).unknown(false);

        const argumentDetailsSchema = Joi.object({
            argumentBy: Joi.string().trim().required(),
            argumentWith: Joi.string().trim().required(),
            nextDateOfHearing: Joi.alternatives().try(
                Joi.date(),
                Joi.string().trim().custom((value, helpers) => {
                    if (!value || value === '') {
                        return helpers.error('any.required');
                    }
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ).required(),
            attachment: Joi.string().trim().allow('', null), // Filename of the attached document for this record
        }).unknown(false);

        const decisionDetailsSchema = Joi.object({
            writStatus: Joi.string().valid('ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION').required(),
            dateOfDecision: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
            decisionByCourt: Joi.string().trim().allow('', null),
            remarks: Joi.string().trim().allow('', null),
            attachment: Joi.string().trim().allow('', null), // Filename of the attached document for decision details
        }).unknown(false);

        const anyOtherDetailsSchema = Joi.object({
            attendingOfficerDetails: Joi.string().trim().required(),
            officerDetails: Joi.object({
                name: Joi.string().trim().required(),
                rank: Joi.string().trim().required(),
                mobile: Joi.string().trim().required(),
            }).required(),
            appearingAGDetails: Joi.string().trim().required(),
            details: Joi.string().trim().required(),
            attachment: Joi.string().trim().allow('', null), // Filename of the attached document for this record
        }).unknown(false);

        const schema: Joi.Schema = Joi.object({
            fir: this.customJoi.objectId().required(),
            type: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY', 'ARGUMENT', 'ANY_OTHER').required(),
            summary: Joi.string().trim().allow('', null),
            details: Joi.string().trim().allow('', null),
            hearingDetails: Joi.when('draft', {
                is: true,
                then: hearingDetailsSchema.allow(null),
                otherwise: hearingDetailsSchema.required(),
            }),
            draft: Joi.boolean().default(false),
            noticeOfMotion: Joi.when('type', {
                is: 'NOTICE_OF_MOTION',
                then: Joi.alternatives().try(
                    noticeOfMotionSchema,
                    Joi.array().items(noticeOfMotionSchema).min(1)
                ).required(),
                otherwise: Joi.optional().allow(null),
            }),
            orderOfProceedingFilename: Joi.string().trim().allow('', null),
            replyTracking: Joi.when('type', {
                is: 'TO_FILE_REPLY',
                then: Joi.alternatives().try(
                    toFileReplySchema,
                    Joi.array().items(toFileReplySchema).min(1)
                ).required(),
                otherwise: Joi.optional().allow(null),
            }),
            argumentDetails: Joi.when('type', {
                is: 'ARGUMENT',
                then: Joi.alternatives().try(
                    argumentDetailsSchema,
                    Joi.array().items(argumentDetailsSchema).min(1)
                ).required(), // Support both single object and array, required for ARGUMENT
                otherwise: Joi.optional().allow(null),
            }),
            anyOtherDetails: Joi.when('type', {
                is: 'ANY_OTHER',
                then: Joi.alternatives().try(
                    anyOtherDetailsSchema,
                    Joi.array().items(anyOtherDetailsSchema).min(1)
                ).required(), // Support both single object and array, required for ANY_OTHER
                otherwise: Joi.optional().allow(null),
            }),
            decisionDetails: decisionDetailsSchema.allow(null),
            createdBy: this.customJoi.objectId().allow(null), // Optional - backend sets it from JWT token
            attachments: Joi.array().items(Joi.object({
                fileName: Joi.string().required(),
                fileUrl: Joi.string().required(),
            })).default([]),
        });
        return schema.validate(body, { stripUnknown: true, abortEarly: false });
    }

    byId(body: { id: string }): Joi.ValidationResult {
        const schema: Joi.Schema = Joi.object().keys({
            id: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }

    byFIR(body: { firId: string }): Joi.ValidationResult {
        const schema: Joi.Schema = Joi.object().keys({
            firId: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
}

export default new ProceedingValidation();


