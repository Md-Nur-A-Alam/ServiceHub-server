"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const betterAuth_1 = require("../config/betterAuth");
const requireAuth = async (req, res, next) => {
    try {
        const session = await betterAuth_1.auth.api.getSession({
            headers: req.headers,
        });
        if (!session) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 401,
                    message: "Unauthorized - Please sign in to access this resource",
                },
            });
        }
        req.user = session.user;
        req.session = session.session;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
exports.default = exports.requireAuth;
