import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import * as jwtConfig from '../config/middleware/jwtAuth';
import AuthRouter from './AuthRouter';
import UserRouter from './UserRouter';

import FIRRouter from './FIRRouter';
import ProceedingRouter from './ProceedingRouter';
import AdminRouter from './AdminRouter';
import BranchRouter from './BranchRouter';
import { getProceedingFilePath } from '../config/middleware/fileUpload';

const swaggerDef = require('../../swaggerDef');

/**
 * @export
 * @param {express.Application} app
 */
export function init(app: express.Application): void {
    const router: express.Router = express.Router();

    /**
     * @description
     *  Forwards any requests to the /v1/users URI to our UserRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/users', jwtConfig.isAuthenticated, UserRouter);

    /**
     * @description
     *  Forwards any requests to the /v1/firs URI to our FIRRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/firs', jwtConfig.isAuthenticated, FIRRouter);

    /**
     * @description
     *  Forwards any requests to the /v1/proceedings URI to our ProceedingRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/proceedings', jwtConfig.isAuthenticated, ProceedingRouter);

    /**
     * @description Forwards any requests to the /auth URI to our AuthRouter
     * @constructs
     */
    app.use('/auth', AuthRouter);

    /**
     * @description
     *  Forwards any requests to the /v1/admin URI to our AdminRouter
     *  Also, check if user authenticated and is admin
     * @constructs
     */
    app.use('/v1/admin', AdminRouter);

    /**
     * @description
     *  Forwards any requests to the /v1/branches URI to our BranchRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/branches', jwtConfig.isAuthenticated, BranchRouter);

    /**
     * @description Serve uploaded proceeding files
     * @constructs
     */
    app.get('/assets/proceedings/:filename', jwtConfig.isAuthenticated, (req: express.Request, res: express.Response) => {
        try {
            const filename = req.params.filename;
            const filepath = getProceedingFilePath(filename);
            res.sendFile(filepath);
        } catch (error) {
            res.status(404).send('File not found');
        }
    });

    /**
     * @description
     *  If swagger.json file exists in root folder, shows swagger api description
     *  else send commands, how to get swagger.json file
     * @constructs
     */
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc({
        swaggerDefinition: swaggerDef,
        apis: [path.join(__dirname, '../../src/**/**/*.ts')],
    })));

    /**
     * @description No results returned mean the object is not found
     * @constructs
     */
    app.use((req, res) => {
        res.status(404).send(http.STATUS_CODES[404]);
    });

    /**
     * @constructs all routes
     */
    app.use(router);
}
