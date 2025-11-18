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
        });
        const hearingDetailsSchema = Joi.object({
            dateOfHearing: Joi.date().required(),
            judgeName: Joi.string().trim().allow('', null).default(''),
            courtNumber: Joi.string().trim().allow('', null).default(''),
        });
        const noticeOfMotionSchema = Joi.object({
            attendanceMode: Joi.string().valid('BY_FORMAT', 'BY_PERSON').allow(null, ''),
            formatSubmitted: Joi.boolean().allow(null),
            formatFilledBy: personSchema.allow(null),
            appearingAG: personSchema.allow(null),
            attendingOfficer: personSchema.allow(null),
            nextDateOfHearing: Joi.date().allow(null),
            officerDeputedForReply: Joi.string().trim().allow('', null),
            vettingOfficerDetails: Joi.string().trim().allow('', null),
            replyFiled: Joi.boolean().allow(null),
            replyFilingDate: Joi.date().allow(null),
            advocateGeneralName: Joi.string().trim().allow('', null),
            investigatingOfficerName: Joi.string().trim().allow('', null),
            replyScrutinizedByHC: Joi.boolean().allow(null),
        }).unknown(false);
        const replyTrackingSchema = Joi.object({
            proceedingInCourt: Joi.string().trim().allow('', null),
            orderInShort: Joi.string().trim().allow('', null),
            nextActionablePoint: Joi.string().trim().allow('', null),
            nextDateOfHearing: Joi.date().allow(null),
        }).unknown(false);
        const argumentDetailsSchema = Joi.object({
            nextDateOfHearing: Joi.date().allow(null),
        }).unknown(false);
        const decisionDetailsSchema = Joi.object({
            writStatus: Joi.string().valid('ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION').required(),
            remarks: Joi.string().trim().allow('', null),
            decisionByCourt: Joi.string().trim().allow('', null),
            dateOfDecision: Joi.date().allow(null),
        }).unknown(false);
        const schema = Joi.object({
            fir: this.customJoi.objectId().required(),
            type: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY', 'ARGUMENT', 'DECISION').required(),
            summary: Joi.string().trim().allow('', null),
            details: Joi.string().trim().allow('', null),
            hearingDetails: hearingDetailsSchema.required(),
            noticeOfMotion: Joi.when('type', {
                is: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY'),
                then: noticeOfMotionSchema.allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            replyTracking: Joi.when('type', {
                is: 'TO_FILE_REPLY',
                then: replyTrackingSchema.allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            argumentDetails: Joi.when('type', {
                is: 'ARGUMENT',
                then: argumentDetailsSchema.allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            decisionDetails: Joi.when('type', {
                is: 'DECISION',
                then: decisionDetailsSchema.allow(null),
                otherwise: Joi.optional().allow(null),
            }),
            createdBy: this.customJoi.objectId().required(),
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