import { NextFunction, Request, Response } from 'express';
import FIRService from './service';
import { HttpError } from '../../config/error';
import { IFIRModel } from './model';
import { RequestWithUser } from '../../config/middleware/jwtAuth';
import AdminService from '../Admin/service';

export async function findAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        const branch = req.branch;
        const role = req.role;
        const isAdmin = role === 'ADMIN';
        
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const firs: IFIRModel[] = await FIRService.findAll(email, branch, isAdmin);
        res.status(200).json(firs);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function findOne(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        const branch = req.branch;
        const role = req.role;
        const isAdmin = role === 'ADMIN';
        
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.findOne(req.params.id, email, branch, isAdmin);
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function create(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        const branch = req.branch;
        
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.insert(req.body, email);
        
        // Create audit log
        try {
            await AdminService.createAuditLog(
                'CREATE_FIR',
                email,
                'FIR',
                { 
                    firId: fir._id.toString(), 
                    firNumber: fir.firNumber,
                    branch: branch || '',
                    writType: fir.writType 
                },
                fir._id.toString(),
                undefined,
                req.ip
            );
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
            // Don't fail the request if audit log fails
        }
        
        res.status(201).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function update(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        const branch = req.branch;
        const role = req.role;
        const isAdmin = role === 'ADMIN';
        
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.update(req.params.id, req.body, email, branch, isAdmin);
        
        // Create audit log
        try {
            await AdminService.createAuditLog(
                'UPDATE_FIR',
                email,
                'FIR',
                { 
                    firId: fir._id.toString(), 
                    firNumber: fir.firNumber,
                    branch: branch || '',
                    changes: Object.keys(req.body)
                },
                fir._id.toString(),
                undefined,
                req.ip
            );
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
        }
        
        res.status(200).json(fir);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

export async function remove(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        const branch = req.branch;
        const role = req.role;
        const isAdmin = role === 'ADMIN';
        
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const fir: IFIRModel = await FIRService.remove(req.params.id, email, branch, isAdmin);
        
        // Create audit log
        try {
            await AdminService.createAuditLog(
                'DELETE_FIR',
                email,
                'FIR',
                { 
                    firId: fir._id.toString(), 
                    firNumber: fir.firNumber,
                    branch: branch || ''
                },
                fir._id.toString(),
                undefined,
                req.ip
            );
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
        }
        
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

export async function writTypeDistribution(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const email = req.email || (req.user as any)?.email;
        if (!email) {
            return next(new HttpError(401, 'User email not found in token'));
        }
        const distribution = await FIRService.writTypeDistribution(email);
        res.status(200).json(distribution);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}
