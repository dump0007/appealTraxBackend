"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("./validation");
const model_1 = require("../User/model");
/**
 * @export
 * @implements {IAuthService}
 */
const AuthService = {
    /* createUser function commented out - signup functionality disabled
     * @param {IUserModel} body
     * @returns {Promise <IUserModel>}
     * @memberof AuthService
     */
    /*
    async createUser(body: IUserModel): Promise < IUserModel > {
        try {
            const validate: Joi.ValidationResult = AuthValidation.createUser(body);

            if (validate.error) {
                throw new Error(validate.error.message);
            }

            const user: IUserModel = new UserModel({
                email: body.email,
                password: body.password,
            });

            const query: IUserModel = await UserModel.findOne({
                email: body.email,
            });

            if (query) {
                throw new Error('This email already exists');
            }

            const saved: IUserModel = await user.save();

            return saved;
        } catch (error) {
            throw new Error(error);
        }
    },
    */
    /**
     * @param {IUserModel} body
     * @returns {Promise <IUserModel>}
     * @memberof AuthService
     */
    getUser(body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validate = validation_1.default.getUser(body);
                if (validate.error) {
                    throw new Error(validate.error.message);
                }
                const user = yield model_1.default.findOne({
                    email: body.email,
                });
                const isMatched = user && (yield user.comparePassword(body.password));
                if (isMatched) {
                    return user;
                }
                throw new Error('Invalid password or email');
            }
            catch (error) {
                throw new Error(error);
            }
        });
    },
};
exports.default = AuthService;
//# sourceMappingURL=service.js.map