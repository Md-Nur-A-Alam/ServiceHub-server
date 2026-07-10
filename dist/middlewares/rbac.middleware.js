"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 401,
                    message: "Unauthorized - Session not found",
                },
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 403,
                    message: `Forbidden - You do not have permission to perform this action. Required role: ${allowedRoles.join(" or ")}`,
                },
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.default = exports.requireRole;
