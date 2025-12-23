import { IUserModel } from '../User/model';
import { IFIRModel } from '../FIR/model';
import { IProceedingModel } from '../Proceeding/model';
import { IAuditLogModel } from '../AuditLog/model';
import { IConfigModel } from '../Config/model';

export interface IAdminService {
    getAllUsers(): Promise<IUserModel[]>;
    getUserById(id: string): Promise<IUserModel>;
    createUser(userData: Partial<IUserModel>): Promise<IUserModel>;
    updateUser(id: string, userData: Partial<IUserModel>): Promise<IUserModel>;
    deleteUser(id: string): Promise<IUserModel>;
    getAdminCount(): Promise<number>;
    getAllFIRs(): Promise<IFIRModel[]>;
    getAllProceedings(): Promise<IProceedingModel[]>;
    getSystemMetrics(): Promise<any>;
    getAdminDashboardMetrics(): Promise<any>;
    getAdminCityGraph(): Promise<any>;
    getAdminWritTypeDistribution(): Promise<Array<{ type: string, count: number }>>;
    getAdminMotionMetrics(): Promise<{ filed: number, pending: number, overdue: number }>;
    getAdminAffidavitMetrics(): Promise<{ filed: number, pending: number, overdue: number }>;
    getAuditLogs(filters?: { userEmail?: string; action?: string; resourceType?: string; startDate?: Date; endDate?: Date; limit?: number; skip?: number }): Promise<IAuditLogModel[]>;
    createAuditLog(action: string, userEmail: string, resourceType: string, details: any, resourceId?: string, userId?: string, ipAddress?: string): Promise<IAuditLogModel>;
    getConfig(): Promise<IConfigModel[]>;
    updateConfig(key: string, value: any, description: string, updatedBy: string): Promise<IConfigModel>;
}
