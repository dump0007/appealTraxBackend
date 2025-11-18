import * as Joi from 'joi';
import { Types } from 'mongoose';
import FIRModel, { IFIRModel } from './model';
import FIRValidation from './validation';
import { IFIRService } from './interface';
import ProceedingModel, { IProceedingModel } from '../Proceeding/model';

const FIRService: IFIRService = {
    async findAll(): Promise<IFIRModel[]> {
        try {
            return await FIRModel.find({}).populate('proceedings');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            return await FIRModel.findOne({ _id: new Types.ObjectId(id) }).populate('proceedings');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async insert(body: IFIRModel): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.create(body);
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const fir: IFIRModel = await FIRModel.create(body);

            // Create initial proceeding for this FIR with sequence number 1
            try {
                const initialProceeding: Partial<IProceedingModel> = {
                    fir: fir._id,
                    sequence: 1, // Explicitly set to 1 for the first proceeding of this FIR
                    type: 'NOTICE_OF_MOTION',
                    summary: `FIR Registration - ${fir.firNumber}`,
                    details: `FIR #${fir.firNumber} registered on ${fir.dateOfFiling.toISOString().split('T')[0]}. Investigating Officer: ${fir.investigatingOfficer} (${fir.investigatingOfficerRank})`,
                    hearingDetails: {
                        dateOfHearing: fir.dateOfFiling, // Use FIR filing date as initial hearing date
                        judgeName: 'To be assigned', // Placeholder until actual judge is assigned
                        courtNumber: 'To be assigned', // Placeholder until actual court is assigned
                    },
                    noticeOfMotion: {
                        attendanceMode: 'BY_FORMAT', // Default attendance mode
                        formatSubmitted: false, // Required when attendanceMode is BY_FORMAT
                        formatFilledBy: {
                            name: fir.investigatingOfficer,
                            rank: fir.investigatingOfficerRank,
                            mobile: String(fir.investigatingOfficerContact),
                        },
                    },
                    createdBy: new Types.ObjectId(), // Placeholder ObjectId - in production, this should be the actual officer ID
                };

                await ProceedingModel.create(initialProceeding);
            } catch (proceedingError) {
                // Log error but don't fail FIR creation if proceeding creation fails
                console.error('Failed to create initial proceeding for FIR:', fir._id, proceedingError);
            }

            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async remove(id: string): Promise<IFIRModel> {
        try {
            const validate: Joi.ValidationResult = FIRValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const fir: IFIRModel = await FIRModel.findOneAndRemove({ _id: new Types.ObjectId(id) });
            return fir;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    async dashboard(): Promise<any> {
        try {
            const ongoingStatuses = [
                'REGISTERED',
                'UNDER_INVESTIGATION',
                'ONGOING_HEARING',
                'CHARGESHEET_FILED',
              ];
          
              const agg = await FIRModel.aggregate([
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
    async cityGraph(): Promise<any> {
        try {
            return await FIRModel.aggregate([
                {
                    $group: {
                        _id: "$branch",
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

    async search(query: string): Promise<IFIRModel[]> {
        try {
            if (!query || query.trim() === '') {
                return await FIRModel.find({}).limit(100).sort({ dateOfFiling: -1 });
            }

            const searchRegex = new RegExp(query.trim(), 'i');
            return await FIRModel.find({
                $or: [
                    { firNumber: searchRegex },
                    { petitionerName: searchRegex },
                    { title: searchRegex },
                    { investigatingOfficer: searchRegex },
                    { branch: searchRegex },
                ],
            }).limit(50).sort({ dateOfFiling: -1 });
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default FIRService;


