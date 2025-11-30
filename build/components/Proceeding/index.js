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
exports.remove = exports.findDraftByFIR = exports.create = exports.findOne = exports.findByFIR = exports.findAll = void 0;
const mongoose_1 = require("mongoose");
const service_1 = require("./service");
const error_1 = require("../../config/error");
const fileUpload_1 = require("../../config/middleware/fileUpload");
function findAll(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const items = yield service_1.default.findAll(email);
            res.status(200).json(items);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findAll = findAll;
function findByFIR(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const items = yield service_1.default.findByFIR(req.params.firId, email);
            res.status(200).json(items);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findByFIR = findByFIR;
function findOne(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const item = yield service_1.default.findOne(req.params.id, email);
            res.status(200).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findOne = findOne;
function create(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            // Extract user info from request if available (from JWT auth)
            let createdBy;
            if (req.user) {
                // If user is authenticated, use a placeholder ObjectId for now
                // In production, you would look up the Officer by email and use their _id
                // For now, create a placeholder ObjectId - can be updated to use actual officer ID
                createdBy = new mongoose_1.Types.ObjectId();
            }
            else {
                // If no auth, use placeholder
                createdBy = new mongoose_1.Types.ObjectId();
            }
            // Handle file upload if present
            let orderOfProceedingFilename;
            if (req.files && req.files.orderOfProceeding) {
                const file = Array.isArray(req.files.orderOfProceeding)
                    ? req.files.orderOfProceeding[0]
                    : req.files.orderOfProceeding;
                // Validate file
                const validation = (0, fileUpload_1.validateProceedingFile)(file);
                if (!validation.valid) {
                    return next(new error_1.HttpError(400, validation.error || 'Invalid file'));
                }
                // Save file
                try {
                    orderOfProceedingFilename = yield (0, fileUpload_1.saveProceedingFile)(file);
                }
                catch (error) {
                    return next(new error_1.HttpError(500, `Failed to save file: ${error.message}`));
                }
            }
            // Parse body - handle both JSON and form-data
            let body;
            if (typeof req.body === 'string') {
                try {
                    body = JSON.parse(req.body);
                }
                catch (_b) {
                    body = req.body;
                }
            }
            else {
                body = req.body;
            }
            // If body has JSON string fields (common when using multipart/form-data), parse them
            const parseJsonField = (fieldName) => {
                if (body[fieldName] && typeof body[fieldName] === 'string') {
                    try {
                        body[fieldName] = JSON.parse(body[fieldName]);
                    }
                    catch (_a) {
                        // Keep as is if parsing fails
                    }
                }
            };
            parseJsonField('hearingDetails');
            parseJsonField('noticeOfMotion');
            parseJsonField('replyTracking');
            parseJsonField('argumentDetails');
            parseJsonField('anyOtherDetails');
            parseJsonField('decisionDetails');
            // Add filename to body
            if (orderOfProceedingFilename) {
                body.orderOfProceedingFilename = orderOfProceedingFilename;
            }
            // Ensure createdBy is set in body if not provided
            if (!body.createdBy) {
                body.createdBy = createdBy;
            }
            const item = yield service_1.default.insert(body, email);
            res.status(201).json(item);
        }
        catch (error) {
            // If file was saved but proceeding creation failed, delete the file
            if (req.files && req.files.orderOfProceeding) {
                const file = Array.isArray(req.files.orderOfProceeding)
                    ? req.files.orderOfProceeding[0]
                    : req.files.orderOfProceeding;
                // Note: We can't easily get the saved filename here, but the file will be orphaned
                // In production, you might want to implement cleanup for orphaned files
            }
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.create = create;
function findDraftByFIR(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const item = yield service_1.default.findDraftByFIR(req.params.firId, email);
            res.status(200).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findDraftByFIR = findDraftByFIR;
function remove(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const item = yield service_1.default.remove(req.params.id, email);
            res.status(200).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.remove = remove;
//# sourceMappingURL=index.js.map