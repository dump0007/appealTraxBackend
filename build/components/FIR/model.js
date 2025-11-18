"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connections = require("../../config/connection/connection");
const FIRSchema = new mongoose_1.Schema({
    firNumber: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    dateOfFiling: { type: Date, required: true },
    sections: { type: [String], default: [] },
    branch: { type: String, required: true, trim: true, index: true },
    investigatingOfficer: { type: String, required: true, trim: true, index: true },
    investigatingOfficerRank: { type: String, required: true, trim: true },
    investigatingOfficerPosting: { type: String, required: true, trim: true },
    investigatingOfficerContact: { type: Number, required: true },
    petitionerName: { type: String, required: true, trim: true },
    petitionerFatherName: { type: String, required: true, trim: true },
    petitionerAddress: { type: String, required: true, trim: true },
    petitionerPrayer: { type: String, required: true, trim: true },
    respondents: { type: [String], default: [] },
    status: {
        type: String,
        required: true,
        enum: ['REGISTERED', 'UNDER_INVESTIGATION', 'ONGOING_HEARING', 'CHARGESHEET_FILED', 'CLOSED', 'WITHDRAWN'],
        default: 'REGISTERED',
        index: true,
    },
    linkedWrits: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'WritModel' }],
    email: { type: String, required: true, trim: true, index: true },
}, {
    collection: 'fir',
    versionKey: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
FIRSchema.index({ branch: 1, dateOfFiling: -1 });
FIRSchema.index({ investigatingOfficer: 1, status: 1 });
FIRSchema.index({ email: 1, dateOfFiling: -1 });
// Virtual populate for ordered proceedings timeline
// Note: Email filtering is handled at the service level when populating
FIRSchema.virtual('proceedings', {
    ref: 'ProceedingModel',
    localField: '_id',
    foreignField: 'fir',
    options: { sort: { sequence: 1 } },
});
exports.default = connections.db.model('FIRModel', FIRSchema);
//# sourceMappingURL=model.js.map