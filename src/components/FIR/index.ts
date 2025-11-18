import { NextFunction, Request, Response } from 'express';
import FIRService from './service';
import { HttpError } from '../../config/error';
import { IFIRModel } from './model';

interface RequestWithUser extends Request {
    user?: { email?: string } | string;
    email?: string;
}

export async function findAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const firs: IFIRModel[] = await FIRService.findAll(email);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findOne(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.findOne(req.params.id, email);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function create(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.insert(req.body, email);
        res.status(201).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function remove(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.remove(req.params.id, email);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


export async function dashboard(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: any = await FIRService.dashboard(email);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


export async function cityGraph(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const graph: any = await FIRService.cityGraph(email);
        res.status(200).json(graph);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function search(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const query: string = req.query.q as string || '';
        const firs: IFIRModel[] = await FIRService.search(query, email);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
