import { Document, Schema, Types } from 'mongoose';
import * as connections from '../../config/connection/connection';

export type ProceedingType = 'NOTICE_OF_MOTION' | 'TO_FILE_REPLY' | 'ARGUMENT' | 'DECISION';

export type CourtAttendanceMode = 'BY_FORMAT' | 'BY_PERSON';

export interface IPersonDetails {
    name: string;
    rank?: string;
    mobile?: string;
}

export interface IHearingDetails {
    dateOfHearing: Date;
    judgeName: string;
    courtNumber: string;
}

export interface INoticeOfMotionDetails {
    attendanceMode: CourtAttendanceMode;
    formatSubmitted?: boolean;
    formatFilledBy?: IPersonDetails;
    appearingAG?: IPersonDetails;
    attendingOfficer?: IPersonDetails;
    nextDateOfHearing?: Date;
    officerDeputedForReply?: string;
    vettingOfficerDetails?: string;
    replyFiled?: boolean;
    replyFilingDate?: Date;
    advocateGeneralName?: string;
    investigatingOfficerName?: string;
    replyScrutinizedByHC?: boolean;
}

export interface IReplyTrackingDetails {
    proceedingInCourt?: string;
    orderInShort?: string;
    nextActionablePoint?: string;
    nextDateOfHearing?: Date;
}

export interface IArgumentDetails {
    nextDateOfHearing?: Date;
}

export type WritStatus = 'ALLOWED' | 'PENDING' | 'DISMISSED' | 'WITHDRAWN' | 'DIRECTION';

export interface IDecisionDetails {
    writStatus: WritStatus;
    remarks?: string;
    decisionByCourt?: string;
    dateOfDecision?: Date;
}

export interface IProceedingModel extends Document {
    fir: Types.ObjectId; // FIR ref
    sequence: number; // auto-increment per FIR
    type: ProceedingType;
    summary?: string;
    details?: string;
    hearingDetails?: IHearingDetails;
    noticeOfMotion?: INoticeOfMotionDetails;
    replyTracking?: IReplyTrackingDetails;
    argumentDetails?: IArgumentDetails;
    decisionDetails?: IDecisionDetails;
    createdBy: Types.ObjectId; // Officer ref
    attachments: {
        fileName: string;
        fileUrl: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSubSchema = new Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
}, { _id: false });

const PersonSubSchema = new Schema({
    name: { type: String, required: true, trim: true },
    rank: { type: String, trim: true },
    mobile: { type: String, trim: true },
}, { _id: false });

const HearingDetailsSubSchema = new Schema({
    dateOfHearing: { type: Date, required: true },
    judgeName: { type: String, trim: true, default: '' },
    courtNumber: { type: String, trim: true, default: '' },
}, { _id: false });

const NoticeOfMotionSubSchema = new Schema({
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

const ReplyTrackingSubSchema = new Schema({
    proceedingInCourt: { type: String },
    orderInShort: { type: String },
    nextActionablePoint: { type: String },
    nextDateOfHearing: { type: Date },
}, { _id: false });

const ArgumentDetailsSubSchema = new Schema({
    nextDateOfHearing: { type: Date },
}, { _id: false });

const DecisionDetailsSubSchema = new Schema({
    writStatus: { type: String, enum: ['ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION'], required: true },
    remarks: { type: String },
    decisionByCourt: { type: String },
    dateOfDecision: { type: Date },
}, { _id: false });

const ProceedingSchema: Schema<IProceedingModel> = new Schema({
    fir: { type: Schema.Types.ObjectId, ref: 'FIRModel', required: true, index: true },
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
    attachments: { type: [AttachmentSubSchema], default: [] },
}, {
    collection: 'proceeding',
    versionKey: false,
    timestamps: true,
});

ProceedingSchema.index({ fir: 1, createdAt: -1 });
ProceedingSchema.index({ fir: 1, sequence: 1 }, { unique: true });

// Auto-increment sequence per FIR
ProceedingSchema.pre('validate', async function (next) {
    const doc = this as unknown as IProceedingModel & { isNew: boolean };
    try {
        if (doc.isNew && (doc.sequence === undefined || doc.sequence === null)) {
            // Find the last sequence for this FIR
            const last = await (this as any).constructor.findOne({ fir: doc.fir }).sort({ sequence: -1 }).select('sequence').lean();
            doc.sequence = last && typeof last.sequence === 'number' ? last.sequence + 1 : 1;
        }
        next();
    } catch (err) {
        next(err);
    }
});

export default connections.db.model<IProceedingModel>('ProceedingModel', ProceedingSchema);


