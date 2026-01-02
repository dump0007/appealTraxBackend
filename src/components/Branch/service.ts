import * as fs from 'fs';
import * as path from 'path';
import { Types } from 'mongoose';
import FIRModel from '../FIR/model';
import ProceedingModel from '../Proceeding/model';

const BRANCHES_FILE_PATH = path.join(__dirname, '../../../assets/branch/branches.json');

interface IBranchService {
    getAllBranches(): Promise<string[]>;
    createBranch(name: string): Promise<string[]>;
    updateBranch(oldName: string, newName: string): Promise<string[]>;
    checkBranchDeletion(name: string): Promise<{ firCount: number; proceedingCount: number }>;
    deleteBranchWithData(name: string): Promise<void>;
}

const BranchService: IBranchService = {
    async getAllBranches(): Promise<string[]> {
        try {
            const branchesData = fs.readFileSync(BRANCHES_FILE_PATH, 'utf-8');
            return JSON.parse(branchesData);
        } catch (error) {
            throw new Error(`Failed to read branches: ${error.message}`);
        }
    },

    async createBranch(name: string): Promise<string[]> {
        try {
            if (!name || name.trim() === '') {
                throw new Error('Branch name is required');
            }

            const branches = await this.getAllBranches();
            
            // Check if branch already exists
            if (branches.includes(name.trim())) {
                throw new Error('Branch already exists');
            }

            branches.push(name.trim());
            branches.sort(); // Keep sorted alphabetically

            fs.writeFileSync(BRANCHES_FILE_PATH, JSON.stringify(branches, null, 2), 'utf-8');
            return branches;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async updateBranch(oldName: string, newName: string): Promise<string[]> {
        try {
            if (!oldName || oldName.trim() === '') {
                throw new Error('Old branch name is required');
            }
            if (!newName || newName.trim() === '') {
                throw new Error('New branch name is required');
            }

            const branches = await this.getAllBranches();
            
            // Check if old branch exists
            if (!branches.includes(oldName.trim())) {
                throw new Error('Old branch name not found');
            }

            // Check if new branch name already exists
            if (branches.includes(newName.trim()) && oldName.trim() !== newName.trim()) {
                throw new Error('New branch name already exists');
            }

            // Update branches array
            const index = branches.indexOf(oldName.trim());
            branches[index] = newName.trim();
            branches.sort();

            fs.writeFileSync(BRANCHES_FILE_PATH, JSON.stringify(branches, null, 2), 'utf-8');

            // Update all FIRs with this branch name
            await FIRModel.updateMany(
                { 
                    $or: [
                        { branchName: oldName.trim() },
                        { branch: oldName.trim() }
                    ]
                },
                { 
                    $set: { 
                        branchName: newName.trim(),
                        branch: newName.trim()
                    }
                }
            );

            return branches;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async checkBranchDeletion(name: string): Promise<{ firCount: number; proceedingCount: number }> {
        try {
            if (!name || name.trim() === '') {
                throw new Error('Branch name is required');
            }

            // Count FIRs with this branch
            const firCount = await FIRModel.countDocuments({
                $or: [
                    { branchName: name.trim() },
                    { branch: name.trim() }
                ]
            });

            // Get all FIR IDs with this branch
            const firs = await FIRModel.find({
                $or: [
                    { branchName: name.trim() },
                    { branch: name.trim() }
                ]
            }).select('_id');

            const firIds = firs.map(fir => fir._id);

            // Count proceedings for these FIRs
            const proceedingCount = await ProceedingModel.countDocuments({
                fir: { $in: firIds }
            });

            return { firCount, proceedingCount };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async deleteBranchWithData(name: string): Promise<void> {
        try {
            if (!name || name.trim() === '') {
                throw new Error('Branch name is required');
            }

            const branches = await this.getAllBranches();
            
            // Check if branch exists
            if (!branches.includes(name.trim())) {
                throw new Error('Branch not found');
            }

            // Get all FIRs with this branch
            const firs = await FIRModel.find({
                $or: [
                    { branchName: name.trim() },
                    { branch: name.trim() }
                ]
            }).select('_id');

            const firIds = firs.map(fir => fir._id);

            // Delete all proceedings for these FIRs
            await ProceedingModel.deleteMany({
                fir: { $in: firIds }
            });

            // Delete all FIRs with this branch
            await FIRModel.deleteMany({
                $or: [
                    { branchName: name.trim() },
                    { branch: name.trim() }
                ]
            });

            // Remove branch from branches array
            const updatedBranches = branches.filter((b: string) => b !== name.trim());
            fs.writeFileSync(BRANCHES_FILE_PATH, JSON.stringify(updatedBranches, null, 2), 'utf-8');
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default BranchService;

