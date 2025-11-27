"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const express = require("express");
const http = require("http");
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwtConfig = require("../config/middleware/jwtAuth");
const AuthRouter_1 = require("./AuthRouter");
const UserRouter_1 = require("./UserRouter");
const FIRRouter_1 = require("./FIRRouter");
const ProceedingRouter_1 = require("./ProceedingRouter");
const fileUpload_1 = require("../config/middleware/fileUpload");
const swaggerDef = require('../../swaggerDef');
/**
 * @export
 * @param {express.Application} app
 */
function init(app) {
    const router = express.Router();
    /**
     * @description
     *  Forwards any requests to the /v1/users URI to our UserRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/users', jwtConfig.isAuthenticated, UserRouter_1.default);
    /**
     * @description
     *  Forwards any requests to the /v1/firs URI to our FIRRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/firs', jwtConfig.isAuthenticated, FIRRouter_1.default);
    /**
     * @description
     *  Forwards any requests to the /v1/proceedings URI to our ProceedingRouter
     *  Also, check if user authenticated
     * @constructs
     */
    app.use('/v1/proceedings', jwtConfig.isAuthenticated, ProceedingRouter_1.default);
    /**
     * @description Forwards any requests to the /auth URI to our AuthRouter
     * @constructs
     */
    app.use('/auth', AuthRouter_1.default);
    /**
     * @description Serve uploaded proceeding files
     * @constructs
     */
    app.get('/assets/proceedings/:filename', jwtConfig.isAuthenticated, (req, res) => {
        try {
            const filename = req.params.filename;
            const filepath = (0, fileUpload_1.getProceedingFilePath)(filename);
            res.sendFile(filepath);
        }
        catch (error) {
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
exports.init = init;
//# sourceMappingURL=index.js.map