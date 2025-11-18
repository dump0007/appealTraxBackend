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
const connections = require("../../config/connection/connection");
const AttachmentSubSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
}, { _id: false });
const PersonSubSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    rank: { type: String, trim: true },
    mobile: { type: String, trim: true },
}, { _id: false });
const HearingDetailsSubSchema = new mongoose_1.Schema({
    dateOfHearing: { type: Date, required: true },
    judgeName: { type: String, trim: true, default: '' },
    courtNumber: { type: String, trim: true, default: '' },
}, { _id: false });
const NoticeOfMotionSubSchema = new mongoose_1.Schema({
    attendanceMode: { type: String, enum: ['BY_FORMAT', 'BY_PERSON'], required: false },
    formatSubmitted: { type: Boolean, required: false },
    formatFilledBy: PersonSubSchema,
    appearingAG: PersonSubSchema,
    attendingOfficer: PersonSubSchema,
    nextDateOfHearing: { type: Date },
    officerDeputedForReply: { type: String, trim: true },
    vettingOfficerDetails: { type: String, trim: true },
    replyFiled: { type: Boolean },
    replyFilingDate: { type: Date },
    advocateGeneralName: { type: String, trim: true },
    investigatingOfficerName: { type: String, trim: true },
    replyScrutinizedByHC: { type: Boolean },
}, { _id: false });
const ReplyTrackingSubSchema = new mongoose_1.Schema({
    proceedingInCourt: { type: String },
    orderInShort: { type: String },
    nextActionablePoint: { type: String },
    nextDateOfHearing: { type: Date },
}, { _id: false });
const ArgumentDetailsSubSchema = new mongoose_1.Schema({
    nextDateOfHearing: { type: Date },
}, { _id: false });
const DecisionDetailsSubSchema = new mongoose_1.Schema({
    writStatus: { type: String, enum: ['ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION'], required: true },
    remarks: { type: String },
    decisionByCourt: { type: String },
    dateOfDecision: { type: Date },
}, { _id: false });
const ProceedingSchema = new mongoose_1.Schema({
    fir: { type: mongoose_1.Schema.Types.ObjectId, ref: 'FIRModel', required: true, index: true },
    sequence: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['NOTICE_OF_MOTION', 'TO_FILE_REPLY', 'ARGUMENT', 'DECISION'],
        index: true,
    },
    summary: { type: String },
    details: { type: String },
    hearingDetails: HearingDetailsSubSchema,
    noticeOfMotion: NoticeOfMotionSubSchema,
    replyTracking: ReplyTrackingSubSchema,
    argumentDetails: ArgumentDetailsSubSchema,
    decisionDetails: DecisionDetailsSubSchema,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
    attachments: { type: [AttachmentSubSchema], default: [] },
}, {
    collection: 'proceeding',
    versionKey: false,
    timestamps: true,
});
ProceedingSchema.index({ fir: 1, createdAt: -1 });
ProceedingSchema.index({ fir: 1, sequence: 1 }, { unique: true });
// Auto-increment sequence per FIR
ProceedingSchema.pre('validate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        try {
            if (doc.isNew && (doc.sequence === undefined || doc.sequence === null)) {
                // Find the last sequence for this FIR
                const last = yield this.constructor.findOne({ fir: doc.fir }).sort({ sequence: -1 }).select('sequence').lean();
                doc.sequence = last && typeof last.sequence === 'number' ? last.sequence + 1 : 1;
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
});
exports.default = connections.db.model('ProceedingModel', ProceedingSchema);
//# sourceMappingURL=model.js.map