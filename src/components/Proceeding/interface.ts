import { IProceedingModel } from './model';

export interface IProceedingService {
    findAll(): Promise<IProceedingModel[]>;
    findByFIR(firId: string): Promise<IProceedingModel[]>;
    findOne(id: string): Promise<IProceedingModel>;
    insert(body: IProceedingModel): Promise<IProceedingModel>;
    remove(id: string): Promise<IProceedingModel>;
}


