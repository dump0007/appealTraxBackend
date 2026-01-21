import * as Joi from 'joi';
import Validation from '../validation';
import { IFIRModel } from './model';

class FIRValidation extends Validation {
    constructor() {
        super();
    }

    create(body: IFIRModel): Joi.ValidationResult {
        const WRIT_TYPES = ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAROLE', 'ANY_OTHER'];
        const BAIL_SUB_TYPES = ['ANTICIPATORY', 'REGULAR'];

        const respondentSchema = Joi.object({
            name: Joi.string().trim().max(500).invalid(null).required(),
            designation: Joi.string().trim().max(200).allow('', null).optional(),
        });

        const investigatingOfficerSchema = Joi.object({
            name: Joi.string().trim().max(500).invalid(null).required(),
            rank: Joi.string().trim().max(200).invalid(null).required(),
            posting: Joi.string().trim().max(500).invalid(null).required(),
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
            firNumber: Joi.string().trim().max(200).invalid(null).required(),
            // title: Joi.string().trim().allow('', null), // Commented out - using petitionerPrayer instead
            // description: Joi.string().trim().allow('', null), // Commented out - using petitionerPrayer instead
            branchName: Joi.string().trim().max(200).invalid(null).required(),
            writNumber: Joi.string().trim().max(200).invalid(null).required(),
            writType: Joi.string().valid(...WRIT_TYPES).required(),
            writYear: Joi.number().integer().min(1900).max(3000).required(),
            writSubType: Joi.when('writType', {
                is: 'BAIL',
                then: Joi.string().valid(...BAIL_SUB_TYPES).invalid(null).required(),
                otherwise: Joi.alternatives().try(
                    Joi.string().valid(...BAIL_SUB_TYPES),
                    Joi.valid(null, '')
                ).allow(null, ''),
            }),
            writTypeOther: Joi.when('writType', {
                is: 'ANY_OTHER',
                then: Joi.string().trim().max(200).invalid(null).required(),
                otherwise: Joi.string().trim().max(200).allow('', null).optional(),
            }),
            underSection: Joi.string().trim().max(200).invalid(null).required(),
            act: Joi.string().trim().max(200).invalid(null).required(),
            policeStation: Joi.string().trim().max(500).invalid(null).required(),
            dateOfFIR: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
            sections: Joi.array().items(Joi.string().trim().max(200)).default([]),
            investigatingOfficers: Joi.array().items(investigatingOfficerSchema).min(1).required(),
            // Legacy fields (optional for backward compatibility)
            investigatingOfficer: Joi.string().trim().max(500).allow('', null),
            investigatingOfficerRank: Joi.string().trim().max(200).allow('', null),
            investigatingOfficerPosting: Joi.string().trim().max(500).allow('', null),
            investigatingOfficerContact: Joi.number().allow(null),
            investigatingOfficerFrom: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
            investigatingOfficerTo: Joi.alternatives().try(Joi.date(), Joi.string()).allow(null),
            petitionerName: Joi.string().trim().max(500).invalid(null).required(),
            petitionerFatherName: Joi.string().trim().max(500).invalid(null).required(),
            petitionerAddress: Joi.string().trim().max(1000).invalid(null).required(),
            petitionerPrayer: Joi.string().trim().max(2000).invalid(null).required(),
            respondents: Joi.array().items(respondentSchema).min(1).required(),
            status: Joi.string().valid('ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION').optional(),
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


