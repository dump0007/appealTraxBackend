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
exports.search = exports.cityGraph = exports.dashboard = exports.remove = exports.update = exports.create = exports.findOne = exports.findAll = void 0;
const service_1 = require("./service");
const error_1 = require("../../config/error");
function findAll(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const firs = yield service_1.default.findAll(email);
            res.status(200).json(firs);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findAll = findAll;
function findOne(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const fir = yield service_1.default.findOne(req.params.id, email);
            res.status(200).json(fir);
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
            const fir = yield service_1.default.insert(req.body, email);
            res.status(201).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.create = create;
function update(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const fir = yield service_1.default.update(req.params.id, req.body, email);
            res.status(200).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.update = update;
function remove(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const fir = yield service_1.default.remove(req.params.id, email);
            res.status(200).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.remove = remove;
function dashboard(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const fir = yield service_1.default.dashboard(email);
            res.status(200).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.dashboard = dashboard;
function cityGraph(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const graph = yield service_1.default.cityGraph(email);
            res.status(200).json(graph);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.cityGraph = cityGraph;
function search(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.email || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            if (!email) {
                return next(new error_1.HttpError(401, 'User email not found in token'));
            }
            const query = req.query.q || '';
            const firs = yield service_1.default.search(query, email);
            res.status(200).json(firs);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.search = search;
//# sourceMappingURL=index.js.map