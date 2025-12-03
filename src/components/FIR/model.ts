import { Document, Schema, Types } from 'mongoose';
import * as connections from '../../config/connection/connection';

// Import WritStatus from Proceeding model
export type WritStatus = 'ALLOWED' | 'PENDING' | 'DISMISSED' | 'WITHDRAWN' | 'DIRECTION';

export type WritType =
    | 'BAIL'
    | 'QUASHING'
    | 'DIRECTION'
    | 'SUSPENSION_OF_SENTENCE'
    | 'PAROLE'
    | 'ANY_OTHER';

export type BailSubType = 'ANTICIPATORY' | 'REGULAR';

export interface IRespondentDetail {
    name: string;
    designation?: string;
}

export interface IInvestigatingOfficerDetail {
    name: string;
    rank: string;
    posting: string;
    contact: number;
    from?: Date | null;
    to?: Date | null;
}

export interface IFIRModel extends Document {
    firNumber: string;
    // title?: string; // Commented out - using petitionerPrayer instead
    // description?: string; // Commented out - using petitionerPrayer instead
    dateOfFIR: Date;
    dateOfFiling?: Date;
    branch?: string;
    branchName: string;
    writNumber: string;
    writType: WritType;
    writYear: number;
    writSubType?: BailSubType | null;
    writTypeOther?: string | null;
    underSection: string;
    act: string;
    policeStation: string;
    sections?: string[];
    investigatingOfficers: IInvestigatingOfficerDetail[];
    // Legacy fields for backward compatibility
    investigatingOfficer?: string;
    investigatingOfficerRank?: string;
    investigatingOfficerPosting?: string;
    investigatingOfficerContact?: number;
    investigatingOfficerFrom?: Date | null;
    investigatingOfficerTo?: Date | null;
    petitionerName: string;
    petitionerFatherName: string;
    petitionerAddress: string;
    petitionerPrayer: string;
    respondents: IRespondentDetail[];
    status: WritStatus;
    linkedWrits?: Types.ObjectId[];
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

const RespondentSchema = new Schema<IRespondentDetail>({
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: false, trim: true },
}, { _id: false });

const InvestigatingOfficerSchema = new Schema<IInvestigatingOfficerDetail>({
    name: { type: String, required: true, trim: true },
    rank: { type: String, required: true, trim: true },
    posting: { type: String, required: true, trim: true },
    contact: { type: Number, required: true },
    from: { type: Date },
    to: { type: Date },
}, { _id: false });

const FIRSchema: Schema<IFIRModel> = new Schema({
    firNumber: { type: String, required: true, unique: true, trim: true, index: true },
    // title: { type: String, trim: true }, // Commented out - using petitionerPrayer instead
    // description: { type: String, trim: true }, // Commented out - using petitionerPrayer instead
    dateOfFIR: { type: Date, required: true },
    dateOfFiling: { type: Date }, // legacy compatibility
    branch: { type: String, trim: true, index: true }, // legacy compatibility
    branchName: { type: String, required: true, trim: true, index: true },
    writNumber: { type: String, required: true, trim: true },
    writType: {
        type: String,
        enum: ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAROLE', 'ANY_OTHER'],
        required: true,
    },
    writYear: { type: Number, min: 1900, max: 3000, required: true },
    writSubType: { 
        type: String, 
        // Don't use enum here - use custom validator instead to allow null
        default: null,
        required: false,
        validate: {
            validator: function(this: any, value: any) {
                // Allow null/undefined/empty string
                if (value === null || value === undefined || value === '') {
                    return true;
                }
                // If value is provided, it must be one of the valid enum values
                return ['ANTICIPATORY', 'REGULAR'].includes(value);
            },
            message: 'writSubType must be either ANTICIPATORY or REGULAR, or null/undefined'
        }
    },
    writTypeOther: { type: String, trim: true },
    underSection: { type: String, required: true, trim: true },
    act: { type: String, required: true, trim: true },
    sections: { type: [String], default: [] },
    policeStation: { type: String, required: true, trim: true },
    investigatingOfficers: { type: [InvestigatingOfficerSchema], required: true, minlength: 1 },
    // Legacy fields for backward compatibility
    investigatingOfficer: { type: String, trim: true, index: true },
    investigatingOfficerRank: { type: String, trim: true },
    investigatingOfficerPosting: { type: String, trim: true },
    investigatingOfficerContact: { type: Number },
    investigatingOfficerFrom: { type: Date },
    investigatingOfficerTo: { type: Date },
    petitionerName: { type: String, required: true, trim: true },
    petitionerFatherName: { type: String, required: true, trim: true },
    petitionerAddress: { type: String, required: true, trim: true },
    petitionerPrayer: { type: String, required: true, trim: true },
    respondents: { type: [RespondentSchema], default: [] },
    status: {
        type: String,
        required: false,
        enum: ['ALLOWED', 'PENDING', 'DISMISSED', 'WITHDRAWN', 'DIRECTION'],
        index: true,
    },
    linkedWrits: [{ type: Schema.Types.ObjectId, ref: 'WritModel' }],
    email: { type: String, required: true, trim: true, index: true },
}, {
    collection: 'fir',
    versionKey: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

FIRSchema.index({ branchName: 1, dateOfFIR: -1 });
FIRSchema.index({ branch: 1, dateOfFiling: -1 });
FIRSchema.index({ investigatingOfficer: 1, status: 1 }); // Legacy index
FIRSchema.index({ 'investigatingOfficers.name': 1, status: 1 }); // New index for array search
FIRSchema.index({ email: 1, dateOfFIR: -1 });

// Pre-save hook to handle writSubType null values
FIRSchema.pre('save', function(next) {
    const doc = this as IFIRModel;
    // Convert null to undefined for writSubType when writType is not BAIL
    if (doc.writType !== 'BAIL' && doc.writSubType === null) {
        doc.writSubType = undefined;
    }
    // Ensure writSubType is undefined (not null) if writType is not BAIL
    if (doc.writType !== 'BAIL') {
        doc.writSubType = undefined;
    }
    next();
});

// Virtual populate for ordered proceedings timeline
// Note: Email filtering is handled at the service level when populating
FIRSchema.virtual('proceedings', {
    ref: 'ProceedingModel',
    localField: '_id',
    foreignField: 'fir',
    options: { sort: { sequence: 1 } },
});

export default connections.db.model<IFIRModel>('FIRModel', FIRSchema);


