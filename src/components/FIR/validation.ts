import * as Joi from 'joi';
import Validation from '../validation';
import { IFIRModel } from './model';

class FIRValidation extends Validation {
    constructor() {
        super();
    }

    create(body: IFIRModel): Joi.ValidationResult {
        const WRIT_TYPES = ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAYROLL', 'ANY_OTHER'];
        const BAIL_SUB_TYPES = ['ANTICIPATORY', 'REGULAR'];

        const respondentSchema = Joi.object({
            name: Joi.string().trim().required(),
            designation: Joi.string().trim().allow('', null).optional(),
        });

        const investigatingOfficerSchema = Joi.object({
            name: Joi.string().trim().required(),
            rank: Joi.string().trim().required(),
            posting: Joi.string().trim().required(),
            contact: Joi.number().required(),
            from: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
            to: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
        }).custom((value, helpers) => {
            const fromDate = value.from ? new Date(value.from) : null;
            const toDate = value.to ? new Date(value.to) : null;
            if (fromDate && toDate && fromDate > toDate) {
                return helpers.error('any.invalid', { message: '"from" date must be before "to" date for investigating officer' });
            }
            return value;
        });

        const schema: Joi.Schema = Joi.object({
            firNumber: Joi.string().trim().required(),
            // title: Joi.string().trim().allow('', null), // Commented out - using petitionerPrayer instead
            // description: Joi.string().trim().allow('', null), // Commented out - using petitionerPrayer instead
            branchName: Joi.string().trim().required(),
            writNumber: Joi.string().trim().required(),
            writType: Joi.string().valid(...WRIT_TYPES).required(),
            writYear: Joi.number().integer().min(1900).max(3000).required(),
            writSubType: Joi.when('writType', {
                is: 'BAIL',
                then: Joi.string().valid(...BAIL_SUB_TYPES).required(),
                otherwise: Joi.alternatives().try(
                    Joi.string().valid(...BAIL_SUB_TYPES),
                    Joi.valid(null, '')
                ).allow(null, ''),
            }),
            writTypeOther: Joi.string().trim().allow('', null).optional(),
            underSection: Joi.string().trim().required(),
            act: Joi.string().trim().required(),
            policeStation: Joi.string().trim().required(),
            dateOfFIR: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
            sections: Joi.array().items(Joi.string().trim()).default([]),
            investigatingOfficers: Joi.array().items(investigatingOfficerSchema).min(1).required(),
            // Legacy fields (optional for backward compatibility)
            investigatingOfficer: Joi.string().trim().allow('', null),
            investigatingOfficerRank: Joi.string().trim().allow('', null),
            investigatingOfficerPosting: Joi.string().trim().allow('', null),
            investigatingOfficerContact: Joi.number().allow(null),
            investigatingOfficerFrom: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
            investigatingOfficerTo: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
            petitionerName: Joi.string().trim().required(),
            petitionerFatherName: Joi.string().trim().required(),
            petitionerAddress: Joi.string().trim().required(),
            petitionerPrayer: Joi.string().trim().required(),
            respondents: Joi.array().items(respondentSchema).min(1).required(),
            status: Joi.string().valid('REGISTERED', 'UNDER_INVESTIGATION', 'ONGOING_HEARING', 'CHARGESHEET_FILED', 'CLOSED', 'WITHDRAWN').default('REGISTERED'),
            linkedWrits: Joi.array().items(this.customJoi.objectId()).default([]),
        });

        return schema.validate(body, { abortEarly: false, stripUnknown: true });
    }

    byId(body: { id: string }): Joi.ValidationResult {
        const schema: Joi.Schema = Joi.object().keys({
            id: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
}

export default new FIRValidation();


