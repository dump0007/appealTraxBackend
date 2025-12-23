import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router: Router = Router();

/**
 * Get all branches
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const branchesPath = path.join(__dirname, '../../assets/branch/branches.json');
        const branchesData = fs.readFileSync(branchesPath, 'utf-8');
        const branches = JSON.parse(branchesData);
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load branches', error: error.message });
    }
});

export default router;

