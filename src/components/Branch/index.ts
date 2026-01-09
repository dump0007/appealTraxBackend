import { NextFunction, Request, Response } from 'express';
import BranchService from './service';
import { HttpError } from '../../config/error';

/**
 * Get all branches
 */
export async function getAllBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const branches: string[] = await BranchService.getAllBranches();
        res.status(200).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Failed to get branches'));
    }
}

/**
 * Create a new branch
 */
export async function createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new HttpError(400, 'Branch name is required'));
        }
        const branches: string[] = await BranchService.createBranch(name);
        res.status(201).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Failed to create branch'));
    }
}

/**
 * Update a branch
 */
export async function updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name: oldName } = req.params;
        const { name: newName } = req.body;
        if (!oldName || !newName) {
            return next(new HttpError(400, 'Both old and new branch names are required'));
        }
        const branches: string[] = await BranchService.updateBranch(oldName, newName);
        res.status(200).json(branches);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Failed to update branch'));
    }
}

/**
 * Check branch deletion (returns count of FIRs and proceedings linked to this branch)
 */
export async function checkBranchDeletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.params;
        if (!name) {
            return next(new HttpError(400, 'Branch name is required'));
        }
        const counts = await BranchService.checkBranchDeletion(name);
        res.status(200).json(counts);
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Failed to check branch deletion'));
    }
}

/**
 * Delete a branch and all associated data
 */
export async function deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { name } = req.params;
        if (!name) {
            return next(new HttpError(400, 'Branch name is required'));
        }
        await BranchService.deleteBranchWithData(name);
        res.status(200).json({ message: 'Branch and all associated data deleted successfully' });
    } catch (error) {
        next(new HttpError(error.status || 500, error.message || 'Failed to delete branch'));
    }
}

