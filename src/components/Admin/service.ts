import * as Joi from 'joi';
import { Types } from 'mongoose';
import UserModel, { IUserModel } from '../User/model';
import FIRModel, { IFIRModel } from '../FIR/model';
import ProceedingModel, { IProceedingModel } from '../Proceeding/model';
import AuditLogModel, { IAuditLogModel } from '../AuditLog/model';
import ConfigModel, { IConfigModel } from '../Config/model';
import { IAdminService } from './interface';
import * as bcrypt from 'bcrypt';

const AdminService: IAdminService = {
    async getAllUsers(): Promise<IUserModel[]> {
        try {
            return await UserModel.find({}).select('-password -passwordResetToken -passwordResetExpires -tokens');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getUserById(id: string): Promise<IUserModel> {
        try {
            const user = await UserModel.findById(new Types.ObjectId(id)).select('-password -passwordResetToken -passwordResetExpires -tokens');
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async createUser(userData: Partial<IUserModel>): Promise<IUserModel> {
        try {
            if (!userData.email || !userData.password) {
                throw new Error('Email and password are required');
            }

            // Check if user already exists
            const existingUser = await UserModel.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const user = new UserModel({
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'USER',
                branch: userData.branch || '',
            });

            return await user.save();
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminCount(): Promise<number> {
        try {
            return await UserModel.countDocuments({ role: 'ADMIN' });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async updateUser(id: string, userData: Partial<IUserModel>): Promise<IUserModel> {
        try {
            const user = await UserModel.findById(new Types.ObjectId(id));
            if (!user) {
                throw new Error('User not found');
            }

            // Check if trying to convert admin to user
            if (userData.role !== undefined && userData.role !== user.role) {
                // If current user is admin and new role is USER, check admin count
                if (user.role === 'ADMIN' && userData.role === 'USER') {
                    const adminCount = await this.getAdminCount();
                    if (adminCount <= 1) {
                        throw new Error('Cannot convert the last admin to user. At least one admin must exist.');
                    }
                }
            }

            // Update fields
            if (userData.email !== undefined) user.email = userData.email;
            if (userData.role !== undefined) user.role = userData.role;
            if (userData.branch !== undefined) user.branch = userData.branch;

            // Handle password update
            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(userData.password, salt);
            }

            return await user.save();
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async deleteUser(id: string): Promise<IUserModel> {
        try {
            const user = await UserModel.findById(new Types.ObjectId(id));
            if (!user) {
                throw new Error('User not found');
            }

            // Check if trying to delete an admin
            if (user.role === 'ADMIN') {
                const adminCount = await this.getAdminCount();
                if (adminCount <= 1) {
                    throw new Error('Cannot delete the last admin. At least one admin must exist.');
                }
            }

            const deletedUser = await UserModel.findByIdAndDelete(new Types.ObjectId(id));
            return deletedUser!;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAllFIRs(): Promise<IFIRModel[]> {
        try {
            return await FIRModel.find({})
                .populate('proceedings')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAllProceedings(): Promise<IProceedingModel[]> {
        try {
            return await ProceedingModel.find({ draft: false })
                .populate('fir')
                .populate('createdBy')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getSystemMetrics(): Promise<any> {
        try {
            const [
                totalUsers,
                totalFIRs,
                totalProceedings,
                usersByRole,
                firsByStatus,
                firsByBranch,
            ] = await Promise.all([
                UserModel.countDocuments({}),
                FIRModel.countDocuments({}),
                ProceedingModel.countDocuments({ draft: false }),
                UserModel.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                    { $project: { role: '$_id', count: 1, _id: 0 } },
                ]),
                FIRModel.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $project: { status: '$_id', count: 1, _id: 0 } },
                ]),
                FIRModel.aggregate([
                    { $group: { _id: { $ifNull: ['$branchName', '$branch'] }, count: { $sum: 1 } } },
                    { $project: { branch: '$_id', count: 1, _id: 0 } },
                    { $sort: { count: -1 } },
                ]),
            ]);

            return {
                totalUsers,
                totalFIRs,
                totalProceedings,
                usersByRole,
                firsByStatus,
                firsByBranch,
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminDashboardMetrics(): Promise<any> {
        try {
            const ongoingStatuses = [
                'REGISTERED',
                'UNDER_INVESTIGATION',
                'ONGOING_HEARING',
                'CHARGESHEET_FILED',
            ];

            const agg = await FIRModel.aggregate([
                // No email filter - get all FIRs
                {
                    $facet: {
                        statusCounts: [
                            { $group: { _id: '$status', count: { $sum: 1 } } },
                            { $project: { status: '$_id', count: 1, _id: 0 } },
                            { $sort: { count: -1 } },
                        ],
                        totalCases: [{ $count: 'total' }],
                        closedCases: [
                            { $match: { status: 'CLOSED' } },
                            { $count: 'closed' },
                        ],
                        ongoingCases: [
                            { $match: { status: { $in: ongoingStatuses } } },
                            { $count: 'ongoing' },
                        ],
                    },
                },
            ]);

            const result = agg[0] || {
                statusCounts: [],
                totalCases: [],
                closedCases: [],
                ongoingCases: [],
            };

            const totalCases = (result.totalCases[0] && result.totalCases[0].total) || 0;
            const closedCases = (result.closedCases[0] && result.closedCases[0].closed) || 0;
            const ongoingCases = (result.ongoingCases[0] && result.ongoingCases[0].ongoing) || 0;
            const statusCounts: any[] = result.statusCounts.map((s: any) => ({
                status: s.status,
                count: s.count,
            }));

            return {
                totalCases,
                closedCases,
                ongoingCases,
                statusCounts,
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminCityGraph(): Promise<any> {
        try {
            return await FIRModel.aggregate([
                // No email filter - get all FIRs
                {
                    $group: {
                        _id: { $ifNull: ['$branchName', '$branch'] },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        branch: "$_id",
                        count: 1
                    }
                },
                { $sort: { branch: 1 } }
            ]);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminWritTypeDistribution(): Promise<Array<{ type: string, count: number }>> {
        try {
            const allWritTypes = ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAROLE', 'ANY_OTHER'];
            
            const distribution = await FIRModel.aggregate([
                // No email filter - get all FIRs
                {
                    $group: {
                        _id: '$writType',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: '$_id',
                        count: 1
                    }
                }
            ]);

            // Create a map for quick lookup
            const distributionMap = new Map(distribution.map(item => [item.type, item.count]));

            // Return all writ types with their counts (0 if not present)
            return allWritTypes.map(type => ({
                type,
                count: distributionMap.get(type) || 0
            }));
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminMotionMetrics(): Promise<{ filed: number, pending: number, overdue: number }> {
        try {
            const now = new Date();
            
            // Get all filed motions across all users
            const filedMotions = await ProceedingModel.find({
                type: 'NOTICE_OF_MOTION',
                draft: false
            });

            let pending = 0;
            let overdue = 0;

            for (const motion of filedMotions) {
                if (motion.hearingDetails && motion.hearingDetails.dateOfHearing) {
                    const hearingDate = new Date(motion.hearingDetails.dateOfHearing);
                    if (hearingDate > now) {
                        pending++;
                    } else if (hearingDate < now) {
                        overdue++;
                    }
                }
            }

            return {
                filed: filedMotions.length,
                pending,
                overdue
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAdminAffidavitMetrics(): Promise<{ filed: number, pending: number, overdue: number }> {
        try {
            const now = new Date();
            
            // Get all filed affidavits across all users
            const filedAffidavits = await ProceedingModel.find({
                type: 'TO_FILE_REPLY',
                draft: false
            });

            let pending = 0;
            let overdue = 0;

            for (const affidavit of filedAffidavits) {
                let hearingDate: Date | null = null;
                
                if (affidavit.replyTracking) {
                    const replyTracking = Array.isArray(affidavit.replyTracking) 
                        ? affidavit.replyTracking[0] 
                        : affidavit.replyTracking;
                    if (replyTracking && replyTracking.nextDateOfHearingReply) {
                        hearingDate = new Date(replyTracking.nextDateOfHearingReply);
                    }
                }
                
                if (!hearingDate && affidavit.hearingDetails && affidavit.hearingDetails.dateOfHearing) {
                    hearingDate = new Date(affidavit.hearingDetails.dateOfHearing);
                }
                
                if (hearingDate) {
                    if (hearingDate > now) {
                        pending++;
                    } else if (hearingDate < now) {
                        overdue++;
                    }
                }
            }

            return {
                filed: filedAffidavits.length,
                pending,
                overdue
            };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getAuditLogs(filters?: {
        userEmail?: string;
        action?: string;
        resourceType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
    }): Promise<IAuditLogModel[]> {
        try {
            const query: any = {};

            if (filters?.userEmail) {
                query.userEmail = filters.userEmail;
            }
            if (filters?.action) {
                query.action = filters.action;
            }
            if (filters?.resourceType) {
                query.resourceType = filters.resourceType;
            }
            if (filters?.startDate || filters?.endDate) {
                query.timestamp = {};
                if (filters.startDate) {
                    query.timestamp.$gte = filters.startDate;
                }
                if (filters.endDate) {
                    query.timestamp.$lte = filters.endDate;
                }
            }

            const limit = filters?.limit || 100;
            const skip = filters?.skip || 0;

            return await AuditLogModel.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async createAuditLog(
        action: string,
        userEmail: string,
        resourceType: string,
        details: any,
        resourceId?: string,
        userId?: string,
        ipAddress?: string
    ): Promise<IAuditLogModel> {
        try {
            const auditLog = new AuditLogModel({
                action,
                userEmail,
                userId,
                resourceType,
                resourceId,
                details,
                timestamp: new Date(),
                ipAddress,
            });

            return await auditLog.save();
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getConfig(): Promise<IConfigModel[]> {
        try {
            return await ConfigModel.find({}).sort({ key: 1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async updateConfig(key: string, value: any, description: string, updatedBy: string): Promise<IConfigModel> {
        try {
            const config = await ConfigModel.findOneAndUpdate(
                { key },
                {
                    key,
                    value,
                    description,
                    updatedBy,
                    updatedAt: new Date(),
                },
                { upsert: true, new: true }
            );

            return config;
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default AdminService;
