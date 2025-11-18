import { Document, Schema, Types } from 'mongoose';
import * as connections from '../../config/connection/connection';

export type FIRStatus =
    | 'REGISTERED'
    | 'UNDER_INVESTIGATION'
    | 'ONGOING_HEARING'
    | 'CHARGESHEET_FILED'
    | 'CLOSED'
    | 'WITHDRAWN';



export interface IFIRModel extends Document {
    firNumber: string;
    title: string;
    description: string;
    dateOfFiling: Date;
    sections: string[]; // IPC/CrPC sections etc.
    branch: string; // Branch ref
    investigatingOfficer: string;
    investigatingOfficerRank:string;
    investigatingOfficerPosting:string;
    investigatingOfficerContact:number;

    petitionerName: string;
    petitionerFatherName: string;
    petitionerAddress: string;
    petitionerPrayer: string;
    respondents:string[];
    status: FIRStatus;
    linkedWrits?: Types.ObjectId[]; // Writ refs
    createdAt: Date;
    updatedAt: Date;
}



const FIRSchema: Schema<IFIRModel> = new Schema({
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
        enum: ['REGISTERED', 'UNDER_INVESTIGATION', 'ONGOING_HEARING','CHARGESHEET_FILED', 'CLOSED', 'WITHDRAWN'],
        default: 'REGISTERED',
        index: true,
    },
    linkedWrits: [{ type: Schema.Types.ObjectId, ref: 'WritModel' }],
}, {
    collection: 'fir',
    versionKey: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

FIRSchema.index({ branch: 1, dateOfFiling: -1 });
FIRSchema.index({ investigatingOfficer: 1, status: 1 });

// Virtual populate for ordered proceedings timeline
FIRSchema.virtual('proceedings', {
    ref: 'ProceedingModel',
    localField: '_id',
    foreignField: 'fir',
    options: { sort: { sequence: 1 } },
});

export default connections.db.model<IFIRModel>('FIRModel', FIRSchema);


