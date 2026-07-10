import { Request, Response, NextFunction } from "express";
import { auth } from "../config/betterAuth";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
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
  } catch (error) {
    next(error);
  }
};
export default requireAuth;
