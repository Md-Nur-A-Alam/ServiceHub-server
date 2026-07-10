import { Request, Response, NextFunction } from "express";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
export default requireRole;
