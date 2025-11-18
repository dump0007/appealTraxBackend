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
exports.remove = exports.create = exports.findOne = exports.findByFIR = exports.findAll = void 0;
const mongoose_1 = require("mongoose");
const service_1 = require("./service");
const error_1 = require("../../config/error");
function findAll(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield service_1.default.findAll();
            res.status(200).json(items);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findAll = findAll;
function findByFIR(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield service_1.default.findByFIR(req.params.firId);
            res.status(200).json(items);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findByFIR = findByFIR;
function findOne(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield service_1.default.findOne(req.params.id);
            res.status(200).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findOne = findOne;
function create(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Extract user info from request if available (from JWT auth)
            let createdBy;
            if (req.user) {
                // If user is authenticated, use a placeholder ObjectId for now
                // In production, you would look up the Officer by email and use their _id
                const userEmail = typeof req.user === 'object' ? req.user.email : null;
                // For now, create a placeholder ObjectId - can be updated to use actual officer ID
                createdBy = new mongoose_1.Types.ObjectId();
            }
            else {
                // If no auth, use placeholder
                createdBy = new mongoose_1.Types.ObjectId();
            }
            // Ensure createdBy is set in body if not provided
            const body = req.body;
            if (!body.createdBy) {
                body.createdBy = createdBy;
            }
            const item = yield service_1.default.insert(body);
            res.status(201).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.create = create;
function remove(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield service_1.default.remove(req.params.id);
            res.status(200).json(item);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.remove = remove;
//# sourceMappingURL=index.js.map