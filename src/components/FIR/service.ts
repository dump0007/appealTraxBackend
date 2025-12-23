import * as Joi from 'joi';
import { Types } from 'mongoose';
import FIRModel, { IFIRModel } from './model';
import FIRValidation from './validation';
import { IFIRService } from './interface';

const FIRService: IFIRService = {
    async findAll(email: string): Promise<IFIRModel[]> {
        try {
            const firs = await FIRModel.find({ email });
            // Manually populate proceedings filtered by email
            for (const fir of firs) {
                await fir.populate({
                    path: 'proceedings',
                    match: { email },
                    options: { sort: { sequence: 1 } }
                });
            }
            return firs;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string, email: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            // Check if user is admin
            const UserModel = (await import('../User/model')).default;
            const user = await UserModel.findOne({ email });
            const isAdmin = user && user.role === 'ADMIN';
            
            let fir;
            if (isAdmin) {
                // Admin can view any FIR
                fir = await FIRModel.findById(new Types.ObjectId(id));
                if (!fir) {
                    throw new Error('FIR not found');
                }
                // Populate all proceedings (no email filter for admin)
                await fir.populate({
                    path: 'proceedings',
                    options: { sort: { sequence: 1 } }
                });
            } else {
                // Regular user: verify ownership
                fir = await FIRModel.findOne({ _id: new Types.ObjectId(id), email });
                if (!fir) {
                    throw new Error('FIR not found or access denied');
                }
                // Manually populate proceedings filtered by email
                await fir.populate({
                    path: 'proceedings',
                    match: { email },
                    options: { sort: { sequence: 1 } }
                });
            }
            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async insert(body: IFIRModel, email: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.create(body);
            if (validate.error) {
                throw new Error(validate.error.message);
            }

            // Normalize date fields (store as UTC midnight where applicable)
            const normalizeDate = (value?: string | Date | null): Date | undefined => {
                if (!value) {
                    return undefined;
                }
                if (typeof value === 'string') {
                    if (!value) return undefined;
                    return new Date(`${value}T00:00:00.000Z`);
                }
                return new Date(value);
            };

            body.dateOfFIR = normalizeDate(body.dateOfFIR) as Date;
            body.dateOfFiling = body.dateOfFIR; // legacy compatibility

            // Normalize dates in investigatingOfficers array
            if (body.investigatingOfficers && Array.isArray(body.investigatingOfficers)) {
                body.investigatingOfficers = body.investigatingOfficers.map(io => ({
                    ...io,
                    from: normalizeDate(io.from) || undefined,
                    to: normalizeDate(io.to) || undefined,
                }));
            }

            // Legacy fields for compatibility (use first IO if available)
            const firstIO = body.investigatingOfficers && body.investigatingOfficers.length > 0 
                ? body.investigatingOfficers[0] 
                : null;
            if (firstIO) {
                body.investigatingOfficer = firstIO.name;
                body.investigatingOfficerRank = firstIO.rank;
                body.investigatingOfficerPosting = firstIO.posting;
                body.investigatingOfficerContact = firstIO.contact;
                body.investigatingOfficerFrom = firstIO.from || undefined;
                body.investigatingOfficerTo = firstIO.to || undefined;
            }

            body.branch = body.branchName;
            body.sections = body.sections && body.sections.length > 0 ? body.sections : [body.underSection].filter(Boolean);
            // Handle writSubType: set to undefined (not null) when writType is not BAIL
            if (body.writType !== 'BAIL') {
                body.writSubType = undefined;
            } else if (body.writSubType === null) {
                // Convert null to undefined for Mongoose compatibility
                body.writSubType = undefined;
            }
            if (body.writType !== 'ANY_OTHER') {
                body.writTypeOther = undefined;
            }

            // title/description removed - using petitionerPrayer instead

            // Set email from token
            body.email = email;
            const fir: IFIRModel = await FIRModel.create(body);

            // No longer creating initial proceeding automatically
            // User will manually create proceeding in Step 2 of the form

            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async update(id: string, body: IFIRModel, email: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const updateValidate: Joi.ValidationResult = FIRValidation.create(body);
            if (updateValidate.error) {
                throw new Error(updateValidate.error.message);
            }

            // Normalize date fields (store as UTC midnight where applicable)
            const normalizeDate = (value?: string | Date | null): Date | undefined => {
                if (!value) {
                    return undefined;
                }
                if (typeof value === 'string') {
                    if (!value) return undefined;
                    return new Date(`${value}T00:00:00.000Z`);
                }
                return new Date(value);
            };

            body.dateOfFIR = normalizeDate(body.dateOfFIR) as Date;
            body.dateOfFiling = body.dateOfFIR; // legacy compatibility

            // Normalize dates in investigatingOfficers array
            if (body.investigatingOfficers && Array.isArray(body.investigatingOfficers)) {
                body.investigatingOfficers = body.investigatingOfficers.map(io => ({
                    ...io,
                    from: normalizeDate(io.from) || undefined,
                    to: normalizeDate(io.to) || undefined,
                }));
            }

            // Legacy fields for compatibility (use first IO if available)
            const firstIO = body.investigatingOfficers && body.investigatingOfficers.length > 0 
                ? body.investigatingOfficers[0] 
                : null;
            if (firstIO) {
                body.investigatingOfficer = firstIO.name;
                body.investigatingOfficerRank = firstIO.rank;
                body.investigatingOfficerPosting = firstIO.posting;
                body.investigatingOfficerContact = firstIO.contact;
                body.investigatingOfficerFrom = firstIO.from || undefined;
                body.investigatingOfficerTo = firstIO.to || undefined;
            }

            body.branch = body.branchName;
            body.sections = body.sections && body.sections.length > 0 ? body.sections : [body.underSection].filter(Boolean);
            // Handle writSubType: set to undefined (not null) when writType is not BAIL
            if (body.writType !== 'BAIL') {
                body.writSubType = undefined;
            } else if (body.writSubType === null) {
                // Convert null to undefined for Mongoose compatibility
                body.writSubType = undefined;
            }
            if (body.writType !== 'ANY_OTHER') {
                body.writTypeOther = undefined;
            }

            // Don't update email - keep original
            const fir: IFIRModel = await FIRModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), email },
                { ...body, email }, // Ensure email is not changed
                { new: true, runValidators: true }
            );
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }
            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async remove(id: string, email: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const fir: IFIRModel = await FIRModel.findOneAndRemove({ _id: new Types.ObjectId(id), email });
            if (!fir) {
                throw new Error('FIR not found or access denied');
            }
            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    async dashboard(email: string): Promise<any> {
        try {
            const ongoingStatuses = [
                'REGISTERED',
                'UNDER_INVESTIGATION',
                'ONGOING_HEARING',
                'CHARGESHEET_FILED',
              ];
          
              const agg = await FIRModel.aggregate([
                { $match: { email } }, // Filter by user email
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
          
              // agg is an array with single element containing facets
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
    async cityGraph(email: string): Promise<any> {
        try {
                return await FIRModel.aggregate([
                { $match: { email } }, // Filter by user email
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
                { $sort: { branch: 1 } } // optional
            ]);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async search(query: string, email: string): Promise<IFIRModel[]> {
        try {
            if (!query || query.trim() === '') {
                return await FIRModel.find({ email }).limit(100).sort({ dateOfFIR: -1, createdAt: -1 });
            }

            const searchRegex = new RegExp(query.trim(), 'i');
            return await FIRModel.find({
                email, // Filter by user email
                $or: [
                    { firNumber: searchRegex },
                    { petitionerName: searchRegex },
                    // { title: searchRegex }, // Commented out - using petitionerPrayer instead
                    { investigatingOfficer: searchRegex }, // Legacy field
                    { 'investigatingOfficers.name': searchRegex }, // New array field
                    { branch: searchRegex },
                    { branchName: searchRegex },
                    { policeStation: searchRegex },
                    { writNumber: searchRegex },
                ],
            }).limit(50).sort({ dateOfFIR: -1, createdAt: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async writTypeDistribution(email: string): Promise<Array<{ type: string, count: number }>> {
        try {
            const allWritTypes = ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAROLE', 'ANY_OTHER'];
            
            const distribution = await FIRModel.aggregate([
                { $match: { email } }, // Filter by user email
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
};

export default FIRService;


