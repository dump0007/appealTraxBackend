import { IUserModel } from '../User/model';

/**
 * @export
 * @interaface IAuthService
 */
export interface IAuthService {
    /* createUser method commented out - signup functionality disabled
     * @param {IUserModel} userModel
     * @returns {Promise<IUserModel>}
     * @memberof AuthService
     */
    // createUser(userModel: IUserModel): Promise < IUserModel > ;
    /**
     * @param {IUserModel} userModel
     * @returns {Promise<IUserModel>}
     * @memberof AuthService
     */
    getUser(userModel: IUserModel): Promise < IUserModel >;
}
