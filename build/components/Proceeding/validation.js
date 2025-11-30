"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const validation_1 = require("../validation");
class ProceedingValidation extends validation_1.default {
    constructor() {
        super();
    }
    create(body) {
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
        const noticeOfMotionSchema = Joi.object({
            attendanceMode: Joi.string().valid('BY_FORMAT', 'BY_PERSON').allow(null, ''),
            formatSubmitted: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: Joi.boolean().required(),
                otherwise: Joi.boolean().allow(null),
            }),
            // formatFilledBy is only required when attendanceMode is BY_FORMAT
            formatFilledBy: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: personSchema.required(),
                otherwise: personSchemaOptional,
            }),
            // appearingAG is legacy - use appearingAGDetails for BY_PERSON mode
            appearingAG: personSchemaOptional,
            // appearingAGDetails is required only for BY_PERSON mode
            appearingAGDetails: Joi.when('attendanceMode', {
                is: 'BY_PERSON',
                then: Joi.string().trim().required(),
                otherwise: Joi.string().trim().allow('', null).optional(),
            }),
            // aagDgWhoWillAppear is required only for BY_FORMAT mode
            aagDgWhoWillAppear: Joi.when('attendanceMode', {
                is: 'BY_FORMAT',
                then: Joi.string().trim().required(),
                otherwise: Joi.string().trim().allow('', null).optional(),
            }),
            // attendingOfficer is legacy - use attendingOfficerDetails for BY_PERSON mode
            attendingOfficer: personSchemaOptional,
            // attendingOfficerDetails is required only for BY_PERSON mode
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
            nextDateOfHearing: Joi.alternatives().try(Joi.date().allow(null), Joi.string().allow('', null).custom((value, helpers) => {
                if (!value || value === '')
                    return null;
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })),
            officerDeputedForReply: Joi.string().trim().allow('', null),
            vettingOfficerDetails: Joi.string().trim().allow('', null),
            replyFiled: Joi.boolean().allow(null),
            replyFilingDate: Joi.alternatives().try(Joi.date().allow(null), Joi.string().allow('', null).custom((value, helpers) => {
                if (!value || value === '')
                    return null;
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })),
            advocateGeneralName: Joi.string().trim().allow('', null),
            replyScrutinizedByHC: Joi.boolean().allow(null),
            investigatingOfficerName: Joi.string().trim().allow('', null),
            // ReplyTracking fields for TO_FILE_REPLY entries (per entry)
            proceedingInCourt: Joi.string().trim().allow('', null),
            orderInShort: Joi.string().trim().allow('', null),
            nextActionablePoint: Joi.string().trim().allow('', null),
            nextDateOfHearingReply: Joi.alternatives().try(Joi.date().allow(null), Joi.string().allow('', null).custom((value, helpers) => {
                if (!value || value === '')
                    return null;
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })),
        }).unknown(false);
        const replyTrackingSchema = Joi.object({
            proceedingInCourt: Joi.string().trim().allow('', null),
            orderInShort: Joi.string().trim().allow('', null),
            nextActionablePoint: Joi.string().trim().allow('', null),
            nextDateOfHearing: Joi.alternatives().try(Joi.date().allow(null), Joi.string().allow('', null).custom((value, helpers) => {
                if (!value || value === '')
                    return null;
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })),
        }).unknown(false);
        const argumentDetailsSchema = Joi.object({
            argumentBy: Joi.string().trim().required(),
            argumentWith: Joi.string().trim().required(),
            nextDateOfHearing: Joi.alternatives().try(Joi.date(), Joi.string().trim().custom((value, helpers) => {
                if (!value || value === '') {
                    return helpers.error('any.required');
                }
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })).required(),
        }).unknown(false);
        const decisionDetailsSchema = Joi.object({
            writStatus: Joi.string().valid('ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION').required(),
            dateOfDecision: Joi.alternatives().try(Joi.date().allow(null), Joi.string().allow('', null).custom((value, helpers) => {
                if (!value || value === '')
                    return null;
                const date = new Date(value);
                return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
            })),
            decisionByCourt: Joi.string().trim().allow('', null),
            remarks: Joi.string().trim().allow('', null),
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
        }).unknown(false);
        const schema = Joi.object({
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
                is: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY'),
                then: Joi.alternatives().try(noticeOfMotionSchema, Joi.array().items(noticeOfMotionSchema).min(1)).allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            orderOfProceedingFilename: Joi.string().trim().allow('', null),
            replyTracking: Joi.when('type', {
                is: 'TO_FILE_REPLY',
                then: replyTrackingSchema.allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            argumentDetails: Joi.when('type', {
                is: 'ARGUMENT',
                then: Joi.alternatives().try(argumentDetailsSchema, Joi.array().items(argumentDetailsSchema).min(1)).allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            anyOtherDetails: Joi.when('type', {
                is: 'ANY_OTHER',
                then: Joi.alternatives().try(anyOtherDetailsSchema, Joi.array().items(anyOtherDetailsSchema).min(1)).allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            decisionDetails: decisionDetailsSchema.allow(null),
            createdBy: this.customJoi.objectId().allow(null),
            attachments: Joi.array().items(Joi.object({
                fileName: Joi.string().required(),
                fileUrl: Joi.string().required(),
            })).default([]),
        });
        return schema.validate(body, { stripUnknown: true, abortEarly: false });
    }
    byId(body) {
        const schema = Joi.object().keys({
            id: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
    byFIR(body) {
        const schema = Joi.object().keys({
            firId: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
}
exports.default = new ProceedingValidation();
//# sourceMappingURL=validation.js.map