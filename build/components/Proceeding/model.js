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
    appearingAGDetails: { type: String, trim: true },
    aagDgWhoWillAppear: { type: String, trim: true },
    attendingOfficer: PersonSubSchema,
    attendingOfficerDetails: { type: String, trim: true },
    investigatingOfficer: PersonSubSchema,
    investigatingOfficerName: { type: String, trim: true },
    nextDateOfHearing: { type: Date },
    officerDeputedForReply: { type: String, trim: true },
    vettingOfficerDetails: { type: String, trim: true },
    replyFiled: { type: Boolean },
    replyFilingDate: { type: Date },
    advocateGeneralName: { type: String, trim: true },
    replyScrutinizedByHC: { type: Boolean },
    // ReplyTracking fields for TO_FILE_REPLY entries (per entry)
    proceedingInCourt: { type: String, trim: true },
    orderInShort: { type: String, trim: true },
    nextActionablePoint: { type: String, trim: true },
    nextDateOfHearingReply: { type: Date },
}, { _id: false });
const ReplyTrackingSubSchema = new mongoose_1.Schema({
    proceedingInCourt: { type: String },
    orderInShort: { type: String },
    nextActionablePoint: { type: String },
    nextDateOfHearing: { type: Date },
}, { _id: false });
const ArgumentDetailsSubSchema = new mongoose_1.Schema({
    argumentBy: { type: String, trim: true },
    argumentWith: { type: String, trim: true },
    nextDateOfHearing: { type: Date },
}, { _id: false });
const DecisionDetailsSubSchema = new mongoose_1.Schema({
    writStatus: { type: String, enum: ['ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION'] },
    dateOfDecision: { type: Date },
    decisionByCourt: { type: String, trim: true },
    remarks: { type: String, trim: true },
}, { _id: false });
const AnyOtherDetailsSubSchema = new mongoose_1.Schema({
    attendingOfficerDetails: { type: String, trim: true },
    officerDetails: PersonSubSchema,
    appearingAGDetails: { type: String, trim: true },
    details: { type: String, trim: true },
}, { _id: false });
const ProceedingSchema = new mongoose_1.Schema({
    fir: { type: mongoose_1.Schema.Types.ObjectId, ref: 'FIRModel', required: true, index: true },
    sequence: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['NOTICE_OF_MOTION', 'TO_FILE_REPLY', 'ARGUMENT', 'ANY_OTHER'],
        index: true,
    },
    summary: { type: String },
    details: { type: String },
    hearingDetails: HearingDetailsSubSchema,
    noticeOfMotion: mongoose_1.Schema.Types.Mixed,
    replyTracking: ReplyTrackingSubSchema,
    argumentDetails: mongoose_1.Schema.Types.Mixed,
    anyOtherDetails: mongoose_1.Schema.Types.Mixed,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
    email: { type: String, required: true, trim: true, index: true },
    draft: { type: Boolean, default: false, index: true },
    attachments: { type: [AttachmentSubSchema], default: [] },
    orderOfProceedingFilename: { type: String, trim: true },
}, {
    collection: 'proceeding',
    versionKey: false,
    timestamps: true,
});
ProceedingSchema.index({ fir: 1, createdAt: -1 });
ProceedingSchema.index({ fir: 1, sequence: 1 }, { unique: true });
ProceedingSchema.index({ email: 1, createdAt: -1 });
// Auto-increment sequence per FIR (only for non-draft proceedings)
ProceedingSchema.pre('validate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        try {
            if (doc.isNew && (doc.sequence === undefined || doc.sequence === null)) {
                // For drafts, use sequence 0 (temporary), for final proceedings, find last non-draft sequence
                if (doc.draft) {
                    doc.sequence = 0; // Drafts use sequence 0
                }
                else {
                    // Find the last non-draft sequence for this FIR
                    const last = yield this.constructor.findOne({ fir: doc.fir, draft: false }).sort({ sequence: -1 }).select('sequence').lean();
                    doc.sequence = last && typeof last.sequence === 'number' ? last.sequence + 1 : 1;
                }
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