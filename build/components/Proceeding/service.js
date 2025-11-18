"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const model_1 = require("./model");
const validation_1 = require("./validation");
const ProceedingService = {
    findAll(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield model_1.default.find({ email })
                    .sort({ fir: 1, sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    findByFIR(firId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byFIR({ firId });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                // First verify the FIR belongs to this user
                const FIRModel = (yield Promise.resolve().then(() => require('../FIR/model'))).default;
                const fir = yield FIRModel.findOne({ _id: new mongoose_1.Types.ObjectId(firId), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                return yield model_1.default.find({ fir: new mongoose_1.Types.ObjectId(firId), email })
                    .sort({ sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    findOne(id, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byId({ id });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                const proceeding = yield model_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(id), email })
                    .populate('fir')
                    .populate('createdBy');
                if (!proceeding) {
                    throw new Error('Proceeding not found or access denied');
                }
                return proceeding;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    insert(body, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Clean up empty date strings and empty objects before validation
                if (body.noticeOfMotion) {
                    // Clean up empty date strings (handle both Date and string types)
                    const nextDate = body.noticeOfMotion.nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined ||
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        body.noticeOfMotion.nextDateOfHearing = undefined;
                    }
                    const replyDate = body.noticeOfMotion.replyFilingDate;
                    if (replyDate === null || replyDate === undefined ||
                        (typeof replyDate === 'string' && String(replyDate).trim() === '')) {
                        body.noticeOfMotion.replyFilingDate = undefined;
                    }
                    // Clean up empty person objects (if name is empty or missing)
                    if (body.noticeOfMotion.formatFilledBy) {
                        if (!body.noticeOfMotion.formatFilledBy.name || body.noticeOfMotion.formatFilledBy.name.trim() === '') {
                            body.noticeOfMotion.formatFilledBy = undefined;
                        }
                    }
                    if (body.noticeOfMotion.appearingAG) {
                        if (!body.noticeOfMotion.appearingAG.name || body.noticeOfMotion.appearingAG.name.trim() === '') {
                            body.noticeOfMotion.appearingAG = undefined;
                        }
                    }
                    if (body.noticeOfMotion.attendingOfficer) {
                        if (!body.noticeOfMotion.attendingOfficer.name || body.noticeOfMotion.attendingOfficer.name.trim() === '') {
                            body.noticeOfMotion.attendingOfficer = undefined;
                        }
                    }
                }
                // Clean up dates in other sections
                if (body.replyTracking) {
                    const nextDate = body.replyTracking.nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined ||
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        body.replyTracking.nextDateOfHearing = undefined;
                    }
                }
                if (body.argumentDetails) {
                    const nextDate = body.argumentDetails.nextDateOfHearing;
                    if (nextDate === null || nextDate === undefined ||
                        (typeof nextDate === 'string' && String(nextDate).trim() === '')) {
                        body.argumentDetails.nextDateOfHearing = undefined;
                    }
                }
                if (body.decisionDetails) {
                    const decisionDate = body.decisionDetails.dateOfDecision;
                    if (decisionDate === null || decisionDate === undefined ||
                        (typeof decisionDate === 'string' && String(decisionDate).trim() === '')) {
                        body.decisionDetails.dateOfDecision = undefined;
                    }
                }
                // Ensure createdBy is set (controller should set it, but ensure it's there)
                if (!body.createdBy) {
                    body.createdBy = new mongoose_1.Types.ObjectId();
                }
                const validationPayload = Object.assign(Object.assign({}, body), { createdBy: typeof body.createdBy === 'string'
                        ? body.createdBy
                        : body.createdBy.toHexString() });
                const validate = validation_1.default.create(validationPayload);
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                // Verify the FIR belongs to this user
                const FIRModel = (yield Promise.resolve().then(() => require('../FIR/model'))).default;
                const fir = yield FIRModel.findOne({ _id: body.fir, email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                // Set email from token
                body.email = email;
                return yield model_1.default.create(body);
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    remove(id, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byId({ id });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                const proceeding = yield model_1.default.findOneAndRemove({ _id: new mongoose_1.Types.ObjectId(id), email });
                if (!proceeding) {
                    throw new Error('Proceeding not found or access denied');
                }
                return proceeding;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
};
exports.default = ProceedingService;
//# sourceMappingURL=service.js.map