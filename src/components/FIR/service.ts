import * as Joi from 'joi';
import { Types } from 'mongoose';
import FIRModel, { IFIRModel } from './model';
import FIRValidation from './validation';
import { IFIRService } from './interface';
import HttpError from '../../config/error';

const sanitizeString = (value: any): any => {
    if (typeof value !== 'string') return value;
    // Remove script tags and their content; then remove any remaining angle-bracket tags
    let sanitized = value.replace(/<script.*?>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    // Remove SQL injection patterns
    sanitized = sanitized.replace(/'(\s*OR\s*'1'='1|;\s*DROP|;\s*DELETE|;\s*UPDATE|UNION\s*SELECT)/gi, '');
    sanitized = sanitized.replace(/(\s*OR\s*'1'='1|\s*OR\s*1=1)/gi, '');
    return sanitized;
};

const FIRService: IFIRService = {

    async findAll(email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel[]> {
        try {
            let firs: IFIRModel[];
            
            if (isAdmin) {
                // Admin can see all FIRs
                firs = await FIRModel.find({});
            } else if (branch && branch.trim() !== '') {
                // Regular user: filter by branch
                firs = await FIRModel.find({
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                });
            } else {
                // No branch assigned or empty branch - return empty array (security: no data access)
                return [];
            }
            
            // Populate proceedings - for branch-based access, show all proceedings for FIRs in branch
            for (const fir of firs) {
                if (isAdmin) {
                    // Admin sees all proceedings
                    await fir.populate({
                        path: 'proceedings',
                        options: { sort: { sequence: 1 } }
                    });
                } else if (branch && branch.trim() !== '') {
                    // Regular user: show all proceedings for FIRs in their branch
                    await fir.populate({
                        path: 'proceedings',
                        options: { sort: { sequence: 1 } }
                    });
                }
            }
            return firs;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel> {
        try {
            // Validate ObjectId format explicitly first (before Joi validation to avoid Joi errors)
            if (!Types.ObjectId.isValid(id)) {
                throw new HttpError(400, 'Invalid FIR ID format');
            }
            
            // Try to create ObjectId to catch any creation errors
            let objectId;
            try {
                objectId = new Types.ObjectId(id);
            } catch (objIdError: any) {
                throw new HttpError(400, 'Invalid FIR ID format');
            }
            
            // Now validate with Joi (should pass since we already validated ObjectId format)
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                const errorMessage = validate.error.details && validate.error.details.length > 0
                    ? validate.error.details.map((d: any) => d.message).join('; ')
                    : (validate.error.message || 'Invalid FIR ID format');
                throw new HttpError(400, errorMessage);
            }
            
            let fir;
            if (isAdmin) {
                // Admin can view any FIR
                fir = await FIRModel.findById(objectId);
                if (!fir) {
                    throw new HttpError(404, 'FIR not found');
                }
                // Populate all proceedings
                await fir.populate({
                    path: 'proceedings',
                    options: { sort: { sequence: 1 } }
                });
            } else if (branch) {
                // Regular user: verify FIR belongs to their branch
                fir = await FIRModel.findOne({
                    _id: objectId,
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                });
                if (!fir) {
                    // Check if FIR exists but belongs to different branch (403) or doesn't exist (404)
                    const firExists = await FIRModel.findById(objectId);
                    if (firExists) {
                        throw new HttpError(403, 'Access denied');
                    } else {
                        throw new HttpError(404, 'FIR not found');
                    }
                }
                // Populate all proceedings for FIRs in their branch
                await fir.populate({
                    path: 'proceedings',
                    options: { sort: { sequence: 1 } }
                });
            } else {
                // Fallback: verify ownership by email
                fir = await FIRModel.findOne({ _id: objectId, email });
                if (!fir) {
                    throw new HttpError(404, 'FIR not found or access denied');
                }
                await fir.populate({
                    path: 'proceedings',
                    match: { email },
                    options: { sort: { sequence: 1 } }
                });
            }
            return fir;
        } catch (error: any) {
            // Preserve HttpError status codes, otherwise wrap in generic error
            if (error instanceof HttpError) {
                throw error;
            }
            // Convert validation errors or cast errors to 400
            const errorMessage = error?.message || '';
            if (error.name === 'ValidationError' || 
                error.name === 'CastError' ||
                errorMessage.includes('ObjectId') || 
                errorMessage.includes('objectId') ||
                errorMessage.includes('Cast to ObjectId') ||
                errorMessage.includes('Argument passed in must be a string of 12 bytes') ||
                errorMessage.includes('24 hex characters') ||
                errorMessage.includes('Invalid')) {
                throw new HttpError(400, 'Invalid FIR ID format');
            }
            // Log unexpected errors for debugging
            console.error('Unexpected error in FIRService.findOne:', error);
            throw new HttpError(500, errorMessage || 'Internal Server Error');
        }
    },

    async insert(body: IFIRModel, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel> {
        try {
            // Access control check BEFORE validation (for proper 403 status)
            if (!isAdmin) {
                const effectiveBranch = branch || body.branch || body.branchName;
                if (!effectiveBranch || String(effectiveBranch).trim() === '') {
                    throw new HttpError(403, 'Branch is required for FIR creation');
                }
            }

            // Sanitize key string fields to prevent script/SQL injection
            body.petitionerName = sanitizeString(body.petitionerName);
            body.petitionerFatherName = sanitizeString(body.petitionerFatherName);
            body.petitionerAddress = sanitizeString(body.petitionerAddress);
            body.petitionerPrayer = sanitizeString(body.petitionerPrayer);
            body.firNumber = sanitizeString(body.firNumber);
            body.writNumber = sanitizeString(body.writNumber);
            body.underSection = sanitizeString(body.underSection);
            body.act = sanitizeString(body.act);
            body.policeStation = sanitizeString(body.policeStation);
            if (body.respondents && Array.isArray(body.respondents)) {
                body.respondents = body.respondents.map(r => ({
                    ...r,
                    name: sanitizeString(r?.name),
                    designation: sanitizeString(r?.designation),
                }));
            }
            if (body.investigatingOfficers && Array.isArray(body.investigatingOfficers)) {
                body.investigatingOfficers = body.investigatingOfficers.map(io => ({
                    ...io,
                    name: sanitizeString(io?.name),
                    rank: sanitizeString(io?.rank),
                    posting: sanitizeString(io?.posting),
                }));
            }

            const validate: Joi.ValidationResult = FIRValidation.create(body);
            if (validate.error) {
                // Format Joi validation error message from details array
                const errorMessage = validate.error.details && validate.error.details.length > 0
                    ? validate.error.details.map((d: any) => d.message).join('; ')
                    : (validate.error.message || 'Validation error');
                throw new HttpError(400, errorMessage);
            }

            // Normalize date fields (store as UTC midnight where applicable)
            const normalizeDate = (value?: string | Date | null): Date | undefined => {
                if (!value) {
                    return undefined;
                }
                if (typeof value === 'string') {
                    if (!value) return undefined;
                    // If already an ISO string with time, use directly; otherwise coerce to midnight UTC
                    if (value.includes('T')) {
                        return new Date(value);
                    }
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

            // Normalize branch fields
            if (!body.branch && body.branchName) {
                body.branch = body.branchName;
            }
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

            // Access control: admins bypass branch requirement; users must supply/own branch
            // (Branch check already done above before validation)
            if (isAdmin) {
                // Admin can create for any branch; ensure branch fields stay consistent
                if (body.branchName) {
                    body.branch = body.branchName;
                }
                body.email = body.email || email;
            } else {
                const effectiveBranch = branch || body.branch || body.branchName;
                body.branch = effectiveBranch;
                body.branchName = effectiveBranch;
                // Set ownership to requesting user
                body.email = email;
            }
            const fir: IFIRModel = await FIRModel.create(body);

            // No longer creating initial proceeding automatically
            // User will manually create proceeding in Step 2 of the form

            return fir;
        } catch (error: any) {
            // Preserve HttpError status codes
            if (error instanceof HttpError) {
                throw error;
            }
            // Convert validation errors to 400
            if (error.name === 'ValidationError' || error.message?.includes('validation')) {
                throw new HttpError(400, error.message || 'Validation error');
            }
            // Convert duplicate key errors to 409
            if (error.code === 11000) {
                throw new HttpError(409, 'Duplicate entry');
            }
            // For other errors, wrap in HttpError with 500
            throw new HttpError(500, error.message || 'Internal Server Error');
        }
    },

    /**
     * Update FIR
     * Admin access: Admins can update any FIR without restrictions (no branch/email filters applied)
     * Regular user: Can only update FIRs in their branch (filtered by branchName or branch field)
     */
    async update(id: string, body: IFIRModel, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new HttpError(400, validate.error.message);
            }
            
            // Build query to find FIR (with access control)
            let query: any = { _id: new Types.ObjectId(id) };
            
            if (isAdmin) {
                // Admin can update any FIR - no restrictions
            } else if (branch) {
                // Regular user: verify FIR belongs to their branch
                query.$or = [
                    { branchName: branch },
                    { branch: branch }
                ];
            } else {
                // Fallback: verify ownership by email
                query.email = email;
            }
            
            // Fetch existing FIR to merge with update body
            const existingFIR: IFIRModel = await FIRModel.findOne(query);
            if (!existingFIR) {
                throw new HttpError(404, 'FIR not found or access denied');
            }
            
            // Check if trying to change writType when ARGUMENT proceeding exists
            if (body.writType && body.writType !== existingFIR.writType) {
                const ProceedingModel = (await import('../Proceeding/model')).default;
                const argumentProceeding = await ProceedingModel.findOne({
                    fir: existingFIR._id,
                    type: 'ARGUMENT',
                    draft: false
                });
                if (argumentProceeding) {
                    throw new HttpError(403, 'Cannot change writType when ARGUMENT proceeding exists');
                }
            }
            
            // Merge update body with existing FIR data (update body takes precedence)
            const mergedBody = {
                ...existingFIR.toObject(),
                ...body,
                _id: existingFIR._id, // Preserve _id
                email: existingFIR.email, // Don't allow email updates
            };
            
            // Validate merged data (cast to IFIRModel for validation)
            const updateValidate: Joi.ValidationResult = FIRValidation.create(mergedBody as IFIRModel);
            if (updateValidate.error) {
                // Format Joi validation error message from details array
                const errorMessage = updateValidate.error.details
                    ? updateValidate.error.details.map((d: any) => d.message).join('; ')
                    : updateValidate.error.message || 'Validation error';
                throw new HttpError(400, errorMessage);
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

            // Use merged body for normalization
            const updateData: any = { ...mergedBody };
            
            // Sanitize string fields in update data
            updateData.petitionerName = sanitizeString(updateData.petitionerName);
            updateData.petitionerFatherName = sanitizeString(updateData.petitionerFatherName);
            updateData.petitionerAddress = sanitizeString(updateData.petitionerAddress);
            updateData.petitionerPrayer = sanitizeString(updateData.petitionerPrayer);
            updateData.firNumber = sanitizeString(updateData.firNumber);
            updateData.writNumber = sanitizeString(updateData.writNumber);
            updateData.underSection = sanitizeString(updateData.underSection);
            updateData.act = sanitizeString(updateData.act);
            updateData.policeStation = sanitizeString(updateData.policeStation);
            if (updateData.respondents && Array.isArray(updateData.respondents)) {
                updateData.respondents = updateData.respondents.map((r: any) => ({
                    ...r,
                    name: sanitizeString(r?.name),
                    designation: sanitizeString(r?.designation),
                }));
            }
            if (updateData.investigatingOfficers && Array.isArray(updateData.investigatingOfficers)) {
                updateData.investigatingOfficers = updateData.investigatingOfficers.map((io: any) => ({
                    ...io,
                    name: sanitizeString(io?.name),
                    rank: sanitizeString(io?.rank),
                    posting: sanitizeString(io?.posting),
                }));
            }
            
            updateData.dateOfFIR = normalizeDate(updateData.dateOfFIR) as Date;
            updateData.dateOfFiling = updateData.dateOfFIR; // legacy compatibility

            // Normalize dates in investigatingOfficers array
            if (updateData.investigatingOfficers && Array.isArray(updateData.investigatingOfficers)) {
                updateData.investigatingOfficers = updateData.investigatingOfficers.map((io: any) => ({
                    ...io,
                    from: normalizeDate(io.from) || undefined,
                    to: normalizeDate(io.to) || undefined,
                }));
            }

            // Legacy fields for compatibility (use first IO if available)
            const firstIO = updateData.investigatingOfficers && updateData.investigatingOfficers.length > 0 
                ? updateData.investigatingOfficers[0] 
                : null;
            if (firstIO) {
                updateData.investigatingOfficer = firstIO.name;
                updateData.investigatingOfficerRank = firstIO.rank;
                updateData.investigatingOfficerPosting = firstIO.posting;
                updateData.investigatingOfficerContact = firstIO.contact;
                updateData.investigatingOfficerFrom = firstIO.from || undefined;
                updateData.investigatingOfficerTo = firstIO.to || undefined;
            }

            updateData.branch = updateData.branchName;
            updateData.sections = updateData.sections && updateData.sections.length > 0 ? updateData.sections : [updateData.underSection].filter(Boolean);
            // Handle writSubType: set to undefined (not null) when writType is not BAIL
            if (updateData.writType !== 'BAIL') {
                updateData.writSubType = undefined;
            } else if (updateData.writSubType === null) {
                // Convert null to undefined for Mongoose compatibility
                updateData.writSubType = undefined;
            }
            if (updateData.writType !== 'ANY_OTHER') {
                updateData.writTypeOther = undefined;
            }
            
            // Remove _id from update data (can't update _id)
            delete updateData._id;
            
            const fir: IFIRModel = await FIRModel.findOneAndUpdate(
                query,
                updateData,
                { new: true, runValidators: true }
            );
            if (!fir) {
                throw new HttpError(404, 'FIR not found or access denied');
            }
            return fir;
        } catch (error: any) {
            // Preserve HttpError status codes
            if (error instanceof HttpError) {
                throw error;
            }
            // Convert validation errors to 400
            if (error.name === 'ValidationError' || error.message?.includes('validation')) {
                throw new HttpError(400, error.message || 'Validation error');
            }
            // For other errors, wrap in HttpError with 500
            throw new HttpError(500, error.message || 'Internal Server Error');
        }
    },

    /**
     * Remove FIR
     * Admin access: Admins can delete any FIR without restrictions (no branch/email filters applied)
     * Regular user: Can only delete FIRs in their branch (filtered by branchName or branch field)
     */
    async remove(id: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            
            let query: any = { _id: new Types.ObjectId(id) };
            
            if (isAdmin) {
                // Admin can delete any FIR - no restrictions
                // No additional query filter needed
            } else if (branch) {
                // Regular user: verify FIR belongs to their branch
                query.$or = [
                    { branchName: branch },
                    { branch: branch }
                ];
            } else {
                // Fallback: verify ownership by email
                query.email = email;
            }
            
            // Verify FIR exists and user has access before cascade delete
            const fir: IFIRModel = await FIRModel.findOne(query);
            if (!fir) {
                throw new HttpError(404, 'FIR not found or access denied');
            }
            
            // Cascade delete: Delete all proceedings associated with this FIR
            const ProceedingModel = (await import('../Proceeding/model')).default;
            const deletedProceedings = await ProceedingModel.deleteMany({ fir: new Types.ObjectId(id) });
            
            // Now delete the FIR
            const deletedFIR: IFIRModel = await FIRModel.findOneAndRemove(query);
            if (!deletedFIR) {
                // This shouldn't happen since we already verified it exists, but handle it anyway
                throw new HttpError(404, 'FIR not found or access denied');
            }
            
            return deletedFIR;
        } catch (error) {
            // Preserve HttpError status codes
            if (error instanceof HttpError) {
                throw error;
            }
            throw new Error(error.message);
        }
    },
    async dashboard(email: string, branch?: string, isAdmin?: boolean): Promise<any> {
        try {
            const ongoingStatuses = [
                'REGISTERED',
                'UNDER_INVESTIGATION',
                'ONGOING_HEARING',
                'CHARGESHEET_FILED',
              ];
          
            // Build match filter based on user role and branch
            let matchFilter: any = {};
            if (isAdmin) {
                // Admin can see all FIRs - no filter needed
                matchFilter = {};
            } else if (branch) {
                // Regular user: filter by branch
                matchFilter = {
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                };
            } else {
                // No branch assigned - return empty results
                matchFilter = { _id: { $exists: false } };
            }
          
              const agg = await FIRModel.aggregate([
                { $match: matchFilter },
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
    async cityGraph(email: string, branch?: string, isAdmin?: boolean): Promise<any> {
        try {
            // Build match filter based on user role and branch
            let matchFilter: any = {};
            if (isAdmin) {
                // Admin can see all FIRs - no filter needed
                matchFilter = {};
            } else if (branch) {
                // Regular user: filter by branch
                matchFilter = {
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                };
            } else {
                // No branch assigned - return empty results
                matchFilter = { _id: { $exists: false } };
            }
            
            return await FIRModel.aggregate([
                { $match: matchFilter },
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

    async search(query: string, email: string, branch?: string, isAdmin?: boolean): Promise<IFIRModel[]> {
        try {
            // Build match filter based on user role and branch
            let baseFilter: any = {};
            if (isAdmin) {
                // Admin can see all FIRs - no base filter needed
                baseFilter = {};
            } else if (branch) {
                // Regular user: filter by branch
                baseFilter = {
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                };
            } else {
                // No branch assigned - return empty results
                baseFilter = { _id: { $exists: false } };
            }
            
            if (!query || query.trim() === '') {
                return await FIRModel.find(baseFilter).limit(100).sort({ dateOfFIR: -1, createdAt: -1 });
            }

            const searchRegex = new RegExp(query.trim(), 'i');
            const searchFilter = {
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
            };
            
            // Combine base filter with search filter
            const combinedFilter = isAdmin 
                ? searchFilter 
                : { ...baseFilter, ...searchFilter };
            
            return await FIRModel.find(combinedFilter).limit(50).sort({ dateOfFIR: -1, createdAt: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async writTypeDistribution(email: string, branch?: string, isAdmin?: boolean): Promise<Array<{ type: string, count: number }>> {
        try {
            // Early return for branchless users
            if (!isAdmin && (!branch || branch.trim() === '')) {
                return [];
            }

            const allWritTypes = ['BAIL', 'QUASHING', 'DIRECTION', 'SUSPENSION_OF_SENTENCE', 'PAROLE', 'ANY_OTHER'];
            
            // Build match filter based on user role and branch
            let matchFilter: any = {};
            if (isAdmin) {
                // Admin can see all FIRs - no filter needed
                matchFilter = {};
            } else if (branch) {
                // Regular user: filter by branch
                matchFilter = {
                    $or: [
                        { branchName: branch },
                        { branch: branch }
                    ]
                };
            }
            
            const distribution = await FIRModel.aggregate([
                { $match: matchFilter },
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


