import { Document, Schema } from 'mongoose';
import * as connections from '../../config/connection/connection';

export type AuditAction = 
    | 'CREATE_FIR'
    | 'UPDATE_FIR'
    | 'DELETE_FIR'
    | 'CREATE_PROCEEDING'
    | 'UPDATE_PROCEEDING'
    | 'DELETE_PROCEEDING'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'LOGIN'
    | 'LOGOUT'
    | 'UPDATE_CONFIG'
    | 'OTHER';

export type ResourceType = 
    | 'FIR'
    | 'PROCEEDING'
    | 'USER'
    | 'CONFIG'
    | 'OTHER';

export interface IAuditLogModel extends Document {
    action: AuditAction;
    userEmail: string;
    userId?: string;
    resourceType: ResourceType;
    resourceId?: string;
    details: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

const AuditLogSchema: Schema<IAuditLogModel> = new Schema({
    action: {
        type: String,
        enum: ['CREATE_FIR', 'UPDATE_FIR', 'DELETE_FIR', 'CREATE_PROCEEDING', 'UPDATE_PROCEEDING', 'DELETE_PROCEEDING', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'LOGIN', 'LOGOUT', 'UPDATE_CONFIG', 'OTHER'],
        required: true,
        index: true,
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    userId: {
        type: String,
        trim: true,
    },
    resourceType: {
        type: String,
        enum: ['FIR', 'PROCEEDING', 'USER', 'CONFIG', 'OTHER'],
        required: true,
        index: true,
    },
    resourceId: {
        type: String,
        trim: true,
    },
    details: {
        type: Schema.Types.Mixed,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    ipAddress: {
        type: String,
        trim: true,
    },
}, {
    collection: 'auditlog',
    versionKey: false,
    timestamps: false,
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userEmail: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export default connections.db.model<IAuditLogModel>('AuditLogModel', AuditLogSchema);

