import { NextFunction, Response } from 'express';
import * as http from 'http';
import HttpError from '../error';
import { RequestWithUser } from './jwtAuth';

/**
 * Middleware to check if user is an admin
 * Must be used after isAuthenticated middleware
 * 
 * @param {RequestWithUser} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 */
export function isAdmin(req: RequestWithUser, res: Response, next: NextFunction): void {
    const role = req.role || (req.user as any)?.role;
    
    if (role !== 'ADMIN') {
        return next(new HttpError(403, 'Admin access required'));
    }
    
    return next();
}

