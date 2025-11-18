import * as jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import * as http from 'http';
import app from '../server/server';
import HttpError from '../error';

interface JWTPayload {
    email: string;
    iat?: number;
    exp?: number;
}

interface RequestWithUser extends Request {
    user: JWTPayload | string;
    email?: string; // Extracted email for convenience
}

/**
 *
 * @param {RequestWithUser} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 * @swagger
 *  components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 */
export function isAuthenticated(req: RequestWithUser, res: Response, next: NextFunction): void {
    const token: string | string[] = req.headers['x-access-token'];
    console.log(token);
    if (token) {
        try {
            const decoded = jwt.verify(token.toString(), app.get('secret')) as JWTPayload;
            
            req.user = decoded;
            // Extract email for convenience
            if (decoded && typeof decoded === 'object' && 'email' in decoded) {
                req.email = decoded.email;
            }

            return next();
        } catch (error) {
            console.log("ERROR -> ", error.message);
            
            return next(new HttpError(401, http.STATUS_CODES[401]));
        }
    }

    return next(new HttpError(400, 'No token provided'));
}
