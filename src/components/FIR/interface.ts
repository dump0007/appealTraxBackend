import { IFIRModel } from './model';

export interface IFIRService {
    findAll(email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel[]>;
    findOne(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel>;
    insert(body: IFIRModel, email: string): Promise<IFIRModel>;
    update(id: string, body: IFIRModel, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel>;
    remove(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel>;
    dashboard(email: string, branch?: string, isAdmin?: boolean): Promise<any>;
    cityGraph(email: string, branch?: string, isAdmin?: boolean): Promise<any>;
    search(query: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel[]>;
    writTypeDistribution(email: string, branch?: string, isAdmin?: boolean): Promise<Array<{ type: string, count: number }>>;
}


