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
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield model_1.default.find({})
                    .sort({ fir: 1, sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    findByFIR(firId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byFIR({ firId });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                return yield model_1.default.find({ fir: new mongoose_1.Types.ObjectId(firId) })
                    .sort({ sequence: 1 })
                    .populate('fir')
                    .populate('createdBy');
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byId({ id });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                return yield model_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(id) })
                    .populate('fir')
                    .populate('createdBy');
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    insert(body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.create(body);
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                return yield model_1.default.create(body);
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byId({ id });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                const proceeding = yield model_1.default.findOneAndRemove({ _id: new mongoose_1.Types.ObjectId(id) });
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