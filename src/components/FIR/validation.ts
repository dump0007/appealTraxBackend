import * as Joi from 'joi';
import Validation from '../validation';
import { IFIRModel } from './model';

class FIRValidation extends Validation {
    constructor() {
        super();
    }

    create(body: IFIRModel): Joi.ValidationResult {
        const schema: Joi.Schema = Joi.object().keys({
            firNumber: Joi.string().trim().required(),
            title: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
            dateOfFiling: Joi.date().required(),
            sections: Joi.array().items(Joi.string().trim()).default([]),
            branch: Joi.string().trim().required(),
            investigatingOfficer: Joi.string().trim().required(),
            investigatingOfficerRank: Joi.string().trim().required(),
            investigatingOfficerPosting: Joi.string().trim().required(),
            investigatingOfficerContact: Joi.number().required(),
            petitionerName: Joi.string().trim().required(),
            petitionerFatherName: Joi.string().trim().required(),
            petitionerAddress: Joi.string().trim().required(),
            petitionerPrayer: Joi.string().trim().required(),
            respondents: Joi.array().items(Joi.string().trim()).default([]),
            status: Joi.string().valid('REGISTERED', 'UNDER_INVESTIGATION', 'CHARGESHEET_FILED', 'CLOSED', 'WITHDRAWN'),
            linkedWrits: Joi.array().items(this.customJoi.objectId()).default([]),
        });
        return schema.validate(body);
    }

    byId(body: { id: string }): Joi.ValidationResult {
        const schema: Joi.Schema = Joi.object().keys({
            id: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
}

export default new FIRValidation();


