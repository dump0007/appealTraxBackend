import { IProceedingModel } from './model';

export interface IProceedingService {
    findAll(email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel[]>;
    findByFIR(firId: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel[]>;
    findOne(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel>;
    findDraftByFIR(firId: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel | null>;
    insert(body: IProceedingModel, email: string): Promise<IProceedingModel>;
    update(id: string, body: IProceedingModel, email: string, filesToDelete?: string[], branch?: string, isAdmin?: boolean): Promise<IProceedingModel>;
    remove(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IProceedingModel>;
    motionMetrics(email: string): Promise<{ filed: number, pending: number, overdue: number }>;
    affidavitMetrics(email: string): Promise<{ filed: number, pending: number, overdue: number }>;
}


