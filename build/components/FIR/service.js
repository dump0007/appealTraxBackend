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
const FIRService = {
    findAll(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const firs = yield model_1.default.find({ email });
                // Manually populate proceedings filtered by email
                for (const fir of firs) {
                    yield fir.populate({
                        path: 'proceedings',
                        match: { email },
                        options: { sort: { sequence: 1 } }
                    });
                }
                return firs;
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
                const fir = yield model_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(id), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                // Manually populate proceedings filtered by email
                yield fir.populate({
                    path: 'proceedings',
                    match: { email },
                    options: { sort: { sequence: 1 } }
                });
                return fir;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    insert(body, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.create(body);
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                // Normalize date fields (store as UTC midnight where applicable)
                const normalizeDate = (value) => {
                    if (!value) {
                        return undefined;
                    }
                    if (typeof value === 'string') {
                        if (!value)
                            return undefined;
                        return new Date(`${value}T00:00:00.000Z`);
                    }
                    return new Date(value);
                };
                body.dateOfFIR = normalizeDate(body.dateOfFIR);
                body.dateOfFiling = body.dateOfFIR; // legacy compatibility
                // Normalize dates in investigatingOfficers array
                if (body.investigatingOfficers && Array.isArray(body.investigatingOfficers)) {
                    body.investigatingOfficers = body.investigatingOfficers.map(io => (Object.assign(Object.assign({}, io), { from: normalizeDate(io.from) || undefined, to: normalizeDate(io.to) || undefined })));
                }
                // Legacy fields for compatibility (use first IO if available)
                const firstIO = body.investigatingOfficers && body.investigatingOfficers.length > 0
                    ? body.investigatingOfficers[0]
                    : null;
                if (firstIO) {
                    body.investigatingOfficer = firstIO.name;
                    body.investigatingOfficerRank = firstIO.rank;
                    body.investigatingOfficerPosting = firstIO.posting;
                    body.investigatingOfficerContact = firstIO.contact;
                    body.investigatingOfficerFrom = firstIO.from || undefined;
                    body.investigatingOfficerTo = firstIO.to || undefined;
                }
                body.branch = body.branchName;
                body.sections = body.sections && body.sections.length > 0 ? body.sections : [body.underSection].filter(Boolean);
                // Handle writSubType: set to undefined (not null) when writType is not BAIL
                if (body.writType !== 'BAIL') {
                    body.writSubType = undefined;
                }
                else if (body.writSubType === null) {
                    // Convert null to undefined for Mongoose compatibility
                    body.writSubType = undefined;
                }
                if (body.writType !== 'ANY_OTHER') {
                    body.writTypeOther = undefined;
                }
                // title/description removed - using petitionerPrayer instead
                // Set email from token
                body.email = email;
                const fir = yield model_1.default.create(body);
                // No longer creating initial proceeding automatically
                // User will manually create proceeding in Step 2 of the form
                return fir;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    update(id, body, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.byId({ id });
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                const updateValidate = validation_1.default.create(body);
                if (updateValidate.error) {
                    throw new Error(updateValidate.error.message);
                }
                // Normalize date fields (store as UTC midnight where applicable)
                const normalizeDate = (value) => {
                    if (!value) {
                        return undefined;
                    }
                    if (typeof value === 'string') {
                        if (!value)
                            return undefined;
                        return new Date(`${value}T00:00:00.000Z`);
                    }
                    return new Date(value);
                };
                body.dateOfFIR = normalizeDate(body.dateOfFIR);
                body.dateOfFiling = body.dateOfFIR; // legacy compatibility
                // Normalize dates in investigatingOfficers array
                if (body.investigatingOfficers && Array.isArray(body.investigatingOfficers)) {
                    body.investigatingOfficers = body.investigatingOfficers.map(io => (Object.assign(Object.assign({}, io), { from: normalizeDate(io.from) || undefined, to: normalizeDate(io.to) || undefined })));
                }
                // Legacy fields for compatibility (use first IO if available)
                const firstIO = body.investigatingOfficers && body.investigatingOfficers.length > 0
                    ? body.investigatingOfficers[0]
                    : null;
                if (firstIO) {
                    body.investigatingOfficer = firstIO.name;
                    body.investigatingOfficerRank = firstIO.rank;
                    body.investigatingOfficerPosting = firstIO.posting;
                    body.investigatingOfficerContact = firstIO.contact;
                    body.investigatingOfficerFrom = firstIO.from || undefined;
                    body.investigatingOfficerTo = firstIO.to || undefined;
                }
                body.branch = body.branchName;
                body.sections = body.sections && body.sections.length > 0 ? body.sections : [body.underSection].filter(Boolean);
                // Handle writSubType: set to undefined (not null) when writType is not BAIL
                if (body.writType !== 'BAIL') {
                    body.writSubType = undefined;
                }
                else if (body.writSubType === null) {
                    // Convert null to undefined for Mongoose compatibility
                    body.writSubType = undefined;
                }
                if (body.writType !== 'ANY_OTHER') {
                    body.writTypeOther = undefined;
                }
                // Don't update email - keep original
                const fir = yield model_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(id), email }, Object.assign(Object.assign({}, body), { email }), // Ensure email is not changed
                { new: true, runValidators: true });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                return fir;
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
                const fir = yield model_1.default.findOneAndRemove({ _id: new mongoose_1.Types.ObjectId(id), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                return fir;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    dashboard(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ongoingStatuses = [
                    'REGISTERED',
                    'UNDER_INVESTIGATION',
                    'ONGOING_HEARING',
                    'CHARGESHEET_FILED',
                ];
                const agg = yield model_1.default.aggregate([
                    { $match: { email } },
                    {
                        $facet: {
                            statusCounts: [
                                { $group: { _id: '$status', count: { $sum: 1 } } },
                                { $project: { status: '$_id', count: 1, _id: 0 } },
                                { $sort: { count: -1 } },
                            ],
                            totalCases: [{ $count: 'total' }],
                            closedCases: [
                                { $match: { status: 'CLOSED' } },
                                { $count: 'closed' },
                            ],
                            ongoingCases: [
                                { $match: { status: { $in: ongoingStatuses } } },
                                { $count: 'ongoing' },
                            ],
                        },
                    },
                ]);
                // agg is an array with single element containing facets
                const result = agg[0] || {
                    statusCounts: [],
                    totalCases: [],
                    closedCases: [],
                    ongoingCases: [],
                };
                const totalCases = (result.totalCases[0] && result.totalCases[0].total) || 0;
                const closedCases = (result.closedCases[0] && result.closedCases[0].closed) || 0;
                const ongoingCases = (result.ongoingCases[0] && result.ongoingCases[0].ongoing) || 0;
                const statusCounts = result.statusCounts.map((s) => ({
                    status: s.status,
                    count: s.count,
                }));
                return {
                    totalCases,
                    closedCases,
                    ongoingCases,
                    statusCounts,
                };
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    cityGraph(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield model_1.default.aggregate([
                    { $match: { email } },
                    {
                        $group: {
                            _id: { $ifNull: ['$branchName', '$branch'] },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            branch: "$_id",
                            count: 1
                        }
                    },
                    { $sort: { branch: 1 } } // optional
                ]);
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    search(query, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!query || query.trim() === '') {
                    return yield model_1.default.find({ email }).limit(100).sort({ dateOfFIR: -1, createdAt: -1 });
                }
                const searchRegex = new RegExp(query.trim(), 'i');
                return yield model_1.default.find({
                    email,
                    $or: [
                        { firNumber: searchRegex },
                        { petitionerName: searchRegex },
                        // { title: searchRegex }, // Commented out - using petitionerPrayer instead
                        { investigatingOfficer: searchRegex },
                        { 'investigatingOfficers.name': searchRegex },
                        { branch: searchRegex },
                        { branchName: searchRegex },
                        { policeStation: searchRegex },
                        { writNumber: searchRegex },
                    ],
                }).limit(50).sort({ dateOfFIR: -1, createdAt: -1 });
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
};
exports.default = FIRService;
//# sourceMappingURL=service.js.map