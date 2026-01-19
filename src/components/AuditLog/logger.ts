import { AuditLogModel, AuditAction, AuditEntityType, IAuditFileInfo } from './model';

export interface AuditLogInput {
    actorEmail: string;
    actorRole: string;
    branch?: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    payloadSnapshot?: any;
    files?: IAuditFileInfo[];
    ip?: string;
}

/**
 * Writes an audit log entry. Errors are logged but do not throw to avoid breaking main flow.
 */
export async function logAuditEntry(entry: AuditLogInput): Promise<void> {
    try {
        await AuditLogModel.create(entry);
    } catch (error) {
        console.error('[AuditLog] Failed to write audit entry:', error);
    }
}
