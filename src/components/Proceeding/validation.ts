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
            judgeName: Joi.string().trim().allow('', null).default(''),
            courtNumber: Joi.string().trim().allow('', null).default(''),
        });

        const noticeOfMotionSchema = Joi.object({
            attendanceMode: Joi.string().valid('BY_FORMAT', 'BY_PERSON').allow(null, ''),
            formatSubmitted: Joi.boolean().allow(null),
            // formatFilledBy is only required when attendanceMode is BY_FORMAT
            formatFilledBy: personSchemaOptional,
            // appearingAG and attendingOfficer are only required when attendanceMode is BY_PERSON
            appearingAG: personSchemaOptional,
            attendingOfficer: personSchemaOptional,
            nextDateOfHearing: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
            officerDeputedForReply: Joi.string().trim().allow('', null),
            vettingOfficerDetails: Joi.string().trim().allow('', null),
            replyFiled: Joi.boolean().allow(null),
            replyFilingDate: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
            advocateGeneralName: Joi.string().trim().allow('', null),
            investigatingOfficerName: Joi.string().trim().allow('', null),
            replyScrutinizedByHC: Joi.boolean().allow(null),
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
            nextDateOfHearing: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
        }).unknown(false);

        const decisionDetailsSchema = Joi.object({
            writStatus: Joi.string().valid('ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION').required(),
            remarks: Joi.string().trim().allow('', null),
            decisionByCourt: Joi.string().trim().allow('', null),
            dateOfDecision: Joi.alternatives().try(
                Joi.date().allow(null),
                Joi.string().allow('', null).custom((value, helpers) => {
                    if (!value || value === '') return null;
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? helpers.error('date.invalid') : date;
                })
            ),
        }).unknown(false);

        const schema: Joi.Schema = Joi.object({
            fir: this.customJoi.objectId().required(),
            type: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY', 'ARGUMENT', 'DECISION').required(),
            summary: Joi.string().trim().allow('', null),
            details: Joi.string().trim().allow('', null),
            hearingDetails: hearingDetailsSchema.required(),
            noticeOfMotion: Joi.when('type', {
                is: Joi.string().valid('NOTICE_OF_MOTION', 'TO_FILE_REPLY'),
                then: noticeOfMotionSchema.allow(null), // Both NOTICE_OF_MOTION and TO_FILE_REPLY use noticeOfMotion
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


