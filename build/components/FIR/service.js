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
const model_2 = require("../Proceeding/model");
const FIRService = {
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield model_1.default.find({}).populate('proceedings');
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
                return yield model_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(id) }).populate('proceedings');
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
                const fir = yield model_1.default.create(body);
                // Create initial proceeding for this FIR with sequence number 1
                try {
                    const initialProceeding = {
                        fir: fir._id,
                        sequence: 1,
                        type: 'NOTICE_OF_MOTION',
                        summary: `FIR Registration - ${fir.firNumber}`,
                        details: `FIR #${fir.firNumber} registered on ${fir.dateOfFiling.toISOString().split('T')[0]}. Investigating Officer: ${fir.investigatingOfficer} (${fir.investigatingOfficerRank})`,
                        hearingDetails: {
                            dateOfHearing: fir.dateOfFiling,
                            judgeName: 'To be assigned',
                            courtNumber: 'To be assigned', // Placeholder until actual court is assigned
                        },
                        noticeOfMotion: {
                            attendanceMode: 'BY_FORMAT',
                            formatSubmitted: false,
                            formatFilledBy: {
                                name: fir.investigatingOfficer,
                                rank: fir.investigatingOfficerRank,
                                mobile: String(fir.investigatingOfficerContact),
                            },
                        },
                        createdBy: new mongoose_1.Types.ObjectId(), // Placeholder ObjectId - in production, this should be the actual officer ID
                    };
                    yield model_2.default.create(initialProceeding);
                }
                catch (proceedingError) {
                    // Log error but don't fail FIR creation if proceeding creation fails
                    console.error('Failed to create initial proceeding for FIR:', fir._id, proceedingError);
                }
                return fir;
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
                const fir = yield model_1.default.findOneAndRemove({ _id: new mongoose_1.Types.ObjectId(id) });
                return fir;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
    dashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ongoingStatuses = [
                    'REGISTERED',
                    'UNDER_INVESTIGATION',
                    'ONGOING_HEARING',
                    'CHARGESHEET_FILED',
                ];
                const agg = yield model_1.default.aggregate([
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
    cityGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield model_1.default.aggregate([
                    {
                        $group: {
                            _id: "$branch",
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
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!query || query.trim() === '') {
                    return yield model_1.default.find({}).limit(100).sort({ dateOfFiling: -1 });
                }
                const searchRegex = new RegExp(query.trim(), 'i');
                return yield model_1.default.find({
                    $or: [
                        { firNumber: searchRegex },
                        { petitionerName: searchRegex },
                        { title: searchRegex },
                        { investigatingOfficer: searchRegex },
                        { branch: searchRegex },
                    ],
                }).limit(50).sort({ dateOfFiling: -1 });
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    },
};
exports.default = FIRService;
//# sourceMappingURL=service.js.map