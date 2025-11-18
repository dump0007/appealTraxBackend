"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const validation_1 = require("../validation");
class FIRValidation extends validation_1.default {
    constructor() {
        super();
    }
    create(body) {
        const schema = Joi.object().keys({
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
    byId(body) {
        const schema = Joi.object().keys({
            id: this.customJoi.objectId().required(),
        });
        return schema.validate(body);
    }
}
exports.default = new FIRValidation();
//# sourceMappingURL=validation.js.map