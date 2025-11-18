import { NextFunction, Request, Response } from 'express';
import FIRService from './service';
import { HttpError } from '../../config/error';
import { IFIRModel } from './model';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const firs: IFIRModel[] = await FIRService.findAll();
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const fir: IFIRModel = await FIRService.findOne(req.params.id);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const fir: IFIRModel = await FIRService.insert(req.body);
        res.status(201).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const fir: IFIRModel = await FIRService.remove(req.params.id);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


export async function dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const fir: any = await FIRService.dashboard();
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


export async function cityGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const graph: any = await FIRService.cityGraph();
        res.status(200).json(graph);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const query: string = req.query.q as string || '';
        const firs: IFIRModel[] = await FIRService.search(query);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
