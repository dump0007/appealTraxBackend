import { NextFunction, Request, Response } from 'express';
import HttpError from '../../config/error';
import BranchService from './service';
import { RequestWithUser } from '../../config/middleware/jwtAuth';

/**
 * Get all branches
 */
export async function getAllBranches(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const branches = await BranchService.getAllBranches();
        res.status(200).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Create new branch
 */
export async function createBranch(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new HttpError(400, 'Branch name is required'));
        }
        const branches = await BranchService.createBranch(name);
        res.status(201).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Update branch name
 */
export async function updateBranch(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name: oldName } = req.params;
        const { name: newName } = req.body;
        if (!newName) {
            return next(new HttpError(400, 'New branch name is required'));
        }
        const branches = await BranchService.updateBranch(oldName, newName);
        res.status(200).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Check deletion impact
 */
export async function checkBranchDeletion(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.params;
        const impact = await BranchService.checkBranchDeletion(name);
        res.status(200).json(impact);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}

/**
 * Delete branch and all related data
 */
export async function deleteBranch(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.params;
        await BranchService.deleteBranchWithData(name);
        res.status(200).json({ message: 'Branch and all related data deleted successfully' });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Internal Server Error'));
    }
}


