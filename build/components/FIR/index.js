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
exports.search = exports.cityGraph = exports.dashboard = exports.remove = exports.create = exports.findOne = exports.findAll = void 0;
const service_1 = require("./service");
const error_1 = require("../../config/error");
function findAll(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const firs = yield service_1.default.findAll();
            res.status(200).json(firs);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.findAll = findAll;
function findOne(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fir = yield service_1.default.findOne(req.params.id);
            res.status(200).json(fir);
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
            const fir = yield service_1.default.insert(req.body);
            res.status(201).json(fir);
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
            const fir = yield service_1.default.remove(req.params.id);
            res.status(200).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.remove = remove;
function dashboard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fir = yield service_1.default.dashboard();
            res.status(200).json(fir);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.dashboard = dashboard;
function cityGraph(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const graph = yield service_1.default.cityGraph();
            res.status(200).json(graph);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.cityGraph = cityGraph;
function search(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = req.query.q || '';
            const firs = yield service_1.default.search(query);
            res.status(200).json(firs);
        }
        catch (error) {
            next(new error_1.HttpError(error.status || 500, error.message || 'Internal Server Error'));
        }
    });
}
exports.search = search;
//# sourceMappingURL=index.js.map