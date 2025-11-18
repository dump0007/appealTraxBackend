import { IFIRModel } from './model';

export interface IFIRService {
    findAll(): Promise<IFIRModel[]>;
    findOne(id: string): Promise<IFIRModel>;
    insert(body: IFIRModel): Promise<IFIRModel>;
    remove(id: string): Promise<IFIRModel>;
    dashboard(): Promise<any>;
    cityGraph():Promise<any>;
    search(query: string): Promise<IFIRModel[]>;
}


