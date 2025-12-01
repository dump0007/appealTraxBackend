import { Document, Schema, Types } from 'mongoose';
import * as connections from '../../config/connection/connection';

export type ProceedingType = 'NOTICE_OF_MOTION' | 'TO_FILE_REPLY' | 'ARGUMENT' | 'ANY_OTHER';

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
    appearingAG?: IPersonDetails; // Legacy - for BY_PERSON mode (deprecated, use appearingAGDetails)
    appearingAGDetails?: string; // For BY_PERSON mode
    aagDgWhoWillAppear?: string; // For BY_FORMAT mode
    attendingOfficer?: IPersonDetails; // Legacy - for BY_PERSON mode (deprecated, use attendingOfficerDetails)
    attendingOfficerDetails?: string; // For BY_PERSON mode
    investigatingOfficer?: IPersonDetails;
    details: string; // Details of proceeding
    attachment?: string; // Filename of the attached document for this record
}

export interface IReplyTrackingDetails {
    officerDeputedForReply?: string;
    vettingOfficerDetails?: string;
    replyFiled?: boolean;
    replyFilingDate?: Date;
    advocateGeneralName?: string;
    replyScrutinizedByHC?: boolean;
    investigatingOfficerName?: string;
    proceedingInCourt?: string;
    orderInShort?: string;
    nextActionablePoint?: string;
    nextDateOfHearingReply?: Date;
    attachment?: string; // Filename of the attached document for this record
}

export interface IArgumentDetails {
    argumentBy?: string;
    argumentWith?: string;
    nextDateOfHearing?: Date;
    attachment?: string; // Filename of the attached document for this record
}

export type WritStatus = 'ALLOWED' | 'PENDING' | 'DISMISSED' | 'WITHDRAWN' | 'DIRECTION';

export interface IDecisionDetails {
    writStatus?: WritStatus;
    dateOfDecision?: Date;
    decisionByCourt?: string;
    remarks?: string;
    attachment?: string; // Filename of the attached document for decision details
}

export interface IAnyOtherDetails {
    attendingOfficerDetails?: string;
    officerDetails?: IPersonDetails;
    appearingAGDetails?: string;
    details?: string;
    attachment?: string; // Filename of the attached document for this record
}

export interface IProceedingModel extends Document {
    fir: Types.ObjectId; // FIR ref
    sequence: number; // auto-increment per FIR
    type: ProceedingType;
    summary?: string;
    details?: string;
    hearingDetails?: IHearingDetails;
    noticeOfMotion?: INoticeOfMotionDetails | INoticeOfMotionDetails[]; // Support both single and array
    replyTracking?: IReplyTrackingDetails | IReplyTrackingDetails[]; // Support both single and array for TO_FILE_REPLY
    argumentDetails?: IArgumentDetails | IArgumentDetails[]; // Support both single and array
    anyOtherDetails?: IAnyOtherDetails | IAnyOtherDetails[];
    decisionDetails?: IDecisionDetails;
    createdBy: Types.ObjectId; // Officer ref
    email: string; // User email who created this proceeding
    draft: boolean; // Whether this is a draft proceeding
    attachments: {
        fileName: string;
        fileUrl: string;
    }[];
    orderOfProceedingFilename?: string; // Filename of uploaded order of proceeding
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
    attendanceMode: { type: String, enum: ['BY_FORMAT', 'BY_PERSON'], required: true },
    formatSubmitted: { type: Boolean, required: false },
    formatFilledBy: PersonSubSchema,
    appearingAG: PersonSubSchema, // Legacy - for BY_PERSON mode (deprecated, use appearingAGDetails)
    appearingAGDetails: { type: String, trim: true }, // For BY_PERSON mode
    aagDgWhoWillAppear: { type: String, trim: true }, // For BY_FORMAT mode
    attendingOfficer: PersonSubSchema, // Legacy - for BY_PERSON mode (deprecated, use attendingOfficerDetails)
    attendingOfficerDetails: { type: String, trim: true }, // For BY_PERSON mode
    investigatingOfficer: PersonSubSchema,
    details: { type: String, trim: true, required: true }, // Details of proceeding
    attachment: { type: String, trim: true }, // Filename of the attached document for this record
}, { _id: false });

const ReplyTrackingSubSchema = new Schema({
    officerDeputedForReply: { type: String, trim: true },
    vettingOfficerDetails: { type: String, trim: true },
    replyFiled: { type: Boolean },
    replyFilingDate: { type: Date },
    advocateGeneralName: { type: String, trim: true },
    replyScrutinizedByHC: { type: Boolean },
    investigatingOfficerName: { type: String, trim: true },
    proceedingInCourt: { type: String, trim: true },
    orderInShort: { type: String, trim: true },
    nextActionablePoint: { type: String, trim: true },
    nextDateOfHearingReply: { type: Date },
    attachment: { type: String, trim: true }, // Filename of the attached document for this record
}, { _id: false });

const ArgumentDetailsSubSchema = new Schema({
    argumentBy: { type: String, trim: true },
    argumentWith: { type: String, trim: true },
    nextDateOfHearing: { type: Date },
    attachment: { type: String, trim: true }, // Filename of the attached document for this record
}, { _id: false });

const DecisionDetailsSubSchema = new Schema({
    writStatus: { type: String, enum: ['ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION'] },
    dateOfDecision: { type: Date },
    decisionByCourt: { type: String, trim: true },
    remarks: { type: String, trim: true },
    attachment: { type: String, trim: true }, // Filename of the attached document for decision details
}, { _id: false });

const AnyOtherDetailsSubSchema = new Schema({
    attendingOfficerDetails: { type: String, trim: true },
    officerDetails: PersonSubSchema,
    appearingAGDetails: { type: String, trim: true },
    details: { type: String, trim: true },
    attachment: { type: String, trim: true }, // Filename of the attached document for this record
}, { _id: false });

const ProceedingSchema: Schema<IProceedingModel> = new Schema({
    fir: { type: Schema.Types.ObjectId, ref: 'FIRModel', required: true, index: true },
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
    noticeOfMotion: Schema.Types.Mixed, // Support both single object and array
    replyTracking: Schema.Types.Mixed, // Support both single object and array for TO_FILE_REPLY
    argumentDetails: Schema.Types.Mixed, // Support both single object and array
    anyOtherDetails: Schema.Types.Mixed, // Support both single object and array
    decisionDetails: DecisionDetailsSubSchema, // Decision details with writ status
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
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
ProceedingSchema.pre('validate', async function (next) {
    const doc = this as unknown as IProceedingModel & { isNew: boolean };
    try {
        if (doc.isNew && (doc.sequence === undefined || doc.sequence === null)) {
            // For drafts, use sequence 0 (temporary), for final proceedings, find last non-draft sequence
            if (doc.draft) {
                doc.sequence = 0; // Drafts use sequence 0
            } else {
                // Find the last non-draft sequence for this FIR
                const last = await (this as any).constructor.findOne({ fir: doc.fir, draft: false }).sort({ sequence: -1 }).select('sequence').lean();
                doc.sequence = last && typeof last.sequence === 'number' ? last.sequence + 1 : 1;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

export default connections.db.model<IProceedingModel>('ProceedingModel', ProceedingSchema);


