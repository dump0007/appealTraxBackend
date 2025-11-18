import { IFIRModel } from './model';

export interface IFIRService {
    findAll(email: string): Promise<IFIRModel[]>;
    findOne(id: string, email: string): Promise<IFIRModel>;
    insert(body: IFIRModel, email: string): Promise<IFIRModel>;
    remove(id: string, email: string): Promise<IFIRModel>;
    dashboard(email: string): Promise<any>;
    cityGraph(email: string): Promise<any>;
    search(query: string, email: string): Promise<IFIRModel[]>;
}


