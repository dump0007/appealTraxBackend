import { Document, Schema } from 'mongoose';
import * as connections from '../../config/connection/connection';

export interface IConfigModel extends Document {
    key: string;
    value: any;
    description?: string;
    updatedBy: string;
    updatedAt: Date;
}

const ConfigSchema: Schema<IConfigModel> = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    updatedBy: {
        type: String,
        required: true,
        trim: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, {
    collection: 'config',
    versionKey: false,
    timestamps: false,
});

export default connections.db.model<IConfigModel>('ConfigModel', ConfigSchema);

