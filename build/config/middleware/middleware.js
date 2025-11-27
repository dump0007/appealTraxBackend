"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initErrorHandler = exports.configure = void 0;
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const expressFileUpload = require("express-fileupload");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const index_1 = require("../error/index");
const sendHttpError_1 = require("../error/sendHttpError");
// Ensure assets/proceedings directory exists
const uploadsDir = path.join(process.cwd(), 'assets', 'proceedings');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
/**
 * @export
 * @param {express.Application} app
 */
function configure(app) {
    // express middleware
    app.use(bodyParser.urlencoded({
        extended: false,
    }));
    app.use(bodyParser.json());
    // parse Cookie header and populate req.cookies with an object keyed by the cookie names.
    app.use(cookieParser());
    // returns the compression middleware
    app.use(compression());
    // helps you secure your Express apps by setting various HTTP headers
    app.use(helmet());
    // providing a Connect/Express middleware that can be used to enable CORS with various options
    app.use(cors());
    // file upload middleware
    app.use(expressFileUpload({
        limits: { fileSize: 250 * 1024 },
        abortOnLimit: true,
        createParentPath: true,
    }));
    // custom errors
    app.use(sendHttpError_1.sendHttpErrorModule);
    // cors
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS ');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,'
            + ' Content-Type, Accept,'
            + ' Authorization,'
            + ' Access-Control-Allow-Credentials');
        res.header('Access-Control-Allow-Credentials', 'true');
        next();
    });
}
exports.configure = configure;
/**
 * @export
 * @param {express.Application} app
 */
function initErrorHandler(app) {
    app.use((error, req, res) => {
        if (typeof error === 'number') {
            error = new index_1.HttpError(error); // next(404)
        }
        if (error instanceof index_1.HttpError) {
            res.sendHttpError(error);
        }
        else if (app.get('env') === 'development') {
            error = new index_1.HttpError(500, error.message);
            res.sendHttpError(error);
        }
        else {
            error = new index_1.HttpError(500);
            res.sendHttpError(error, error.message);
        }
        console.error(error);
    });
}
exports.initErrorHandler = initErrorHandler;
//# sourceMappingURL=middleware.js.map