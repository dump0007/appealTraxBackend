import { IProceedingModel } from './model';

export interface IProceedingService {
    findAll(email: string): Promise<IProceedingModel[]>;
    findByFIR(firId: string, email: string): Promise<IProceedingModel[]>;
    findOne(id: string, email: string): Promise<IProceedingModel>;
    findDraftByFIR(firId: string, email: string): Promise<IProceedingModel | null>;
    insert(body: IProceedingModel, email: string): Promise<IProceedingModel>;
    update(id: string, body: IProceedingModel, email: string, filesToDelete?: string[]): Promise<IProceedingModel>;
    remove(id: string, email: string): Promise<IProceedingModel>;
}


