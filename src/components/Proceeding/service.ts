import * as Joi from 'joi';
import { Types } from 'mongoose';
import ProceedingModel, { IProceedingModel } from './model';
import ProceedingValidation from './validation';
import { IProceedingService } from './interface';

const ProceedingService: IProceedingService = {
    async findAll(): Promise<IProceedingModel[]> {
        try {
            return await ProceedingModel.find({})
                .sort({ fir: 1, sequence: 1 })
                .populate('fir')
                .populate('createdBy');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findByFIR(firId: string): Promise<IProceedingModel[]> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byFIR({ firId });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            return await ProceedingModel.find({ fir: new Types.ObjectId(firId) })
                .sort({ sequence: 1 })
                .populate('fir')
                .populate('createdBy');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async findOne(id: string): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            return await ProceedingModel.findOne({ _id: new Types.ObjectId(id) })
                .populate('fir')
                .populate('createdBy');
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async insert(body: IProceedingModel): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.create(body);
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            return await ProceedingModel.create(body);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async remove(id: string): Promise<IProceedingModel> {
        try {
            const validate: Joi.ValidationResult = ProceedingValidation.byId({ id });
            if (validate.error) {
                throw new Error(validate.error.message);
            }
            const proceeding: IProceedingModel = await ProceedingModel.findOneAndRemove({ _id: new Types.ObjectId(id) });
            return proceeding;
        } catch (error) {
            throw new Error(error.message);
        }
    },
};

export default ProceedingService;


