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
    getAllFIRs(startDate?: Date, endDate?: Date, branch?: string): Promise<IFIRModel[]>;
    getAllProceedings(startDate?: Date, endDate?: Date, branch?: string): Promise<IProceedingModel[]>;
    getSystemMetrics(): Promise<any>;
    getAdminDashboardMetrics(startDate?: Date, endDate?: Date, branch?: string): Promise<any>;
    getAdminCityGraph(startDate?: Date, endDate?: Date, branch?: string): Promise<any>;
    getAdminWritTypeDistribution(startDate?: Date, endDate?: Date, branch?: string): Promise<Array<{ type: string, count: number }>>;
    getAdminMotionMetrics(startDate?: Date, endDate?: Date, branch?: string): Promise<{ filed: number, pending: number, overdue: number }>;
    getAdminAffidavitMetrics(startDate?: Date, endDate?: Date, branch?: string): Promise<{ filed: number, pending: number, overdue: number }>;
    getAuditLogs(filters?: { userEmail?: string; action?: string; resourceType?: string; startDate?: Date; endDate?: Date; limit?: number; skip?: number }): Promise<IAuditLogModel[]>;
    getUserActivityLogs(filters?: { userEmail?: string; branch?: string; action?: string; resourceType?: string; startDate?: Date; endDate?: Date; limit?: number; skip?: number }): Promise<IAuditLogModel[]>;
    createAuditLog(action: string, userEmail: string, resourceType: string, details: any, resourceId?: string, userId?: string, ipAddress?: string): Promise<IAuditLogModel>;
    getConfig(): Promise<IConfigModel[]>;
    updateConfig(key: string, value: any, description: string, updatedBy: string): Promise<IConfigModel>;
}
