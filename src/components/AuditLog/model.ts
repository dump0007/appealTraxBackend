import { Document, Schema } from 'mongoose';
import * as connections from '../../config/connection/connection';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE_PLACEHOLDER';
export type AuditEntityType = 'PROCEEDING' | 'FIR';

export interface IAuditFileInfo {
    fileName: string;
    field?: string;
    action?: 'uploaded' | 'deleted' | 'replaced';
}

export interface IAuditLog extends Document {
    actorEmail: string;
    actorRole: string;
    branch?: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    payloadSnapshot?: any;
    files?: IAuditFileInfo[];
    ip?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuditFileInfoSchema = new Schema<IAuditFileInfo>({
    fileName: { type: String, required: true },
    field: { type: String },
    action: { type: String, enum: ['uploaded', 'deleted', 'replaced'] },
}, { _id: false });

const AuditLogSchema: Schema<IAuditLog> = new Schema({
    actorEmail: { type: String, required: true, index: true, trim: true },
    actorRole: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE_PLACEHOLDER'], required: true, index: true },
    entityType: { type: String, enum: ['PROCEEDING', 'FIR'], required: true, index: true },
    entityId: { type: String, required: true, index: true },
    payloadSnapshot: { type: Schema.Types.Mixed },
    files: { type: [AuditFileInfoSchema], default: [] },
    ip: { type: String, trim: true },
}, {
    collection: 'auditlog',
    versionKey: false,
    timestamps: true,
});

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// New audit log model for operation logging
export const AuditLogModel = connections.db.model<IAuditLog>('AuditLog', AuditLogSchema);

// Legacy audit log model for Admin service compatibility
export type LegacyAuditAction = 
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
    action: LegacyAuditAction;
    userEmail: string;
    userId?: string;
    resourceType: ResourceType;
    resourceId?: string;
    details: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

const LegacyAuditLogSchema: Schema<IAuditLogModel> = new Schema({
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

LegacyAuditLogSchema.index({ timestamp: -1 });
LegacyAuditLogSchema.index({ userEmail: 1, timestamp: -1 });
LegacyAuditLogSchema.index({ resourceType: 1, resourceId: 1 });
LegacyAuditLogSchema.index({ action: 1, timestamp: -1 });

// Export legacy model for Admin service
export const LegacyAuditLogModel = connections.db.model<IAuditLogModel>('AuditLogModel', LegacyAuditLogSchema);

