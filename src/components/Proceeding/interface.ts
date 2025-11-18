import { IProceedingModel } from './model';

export interface IProceedingService {
    findAll(email: string): Promise<IProceedingModel[]>;
    findByFIR(firId: string, email: string): Promise<IProceedingModel[]>;
    findOne(id: string, email: string): Promise<IProceedingModel>;
    insert(body: IProceedingModel, email: string): Promise<IProceedingModel>;
    remove(id: string, email: string): Promise<IProceedingModel>;
}


