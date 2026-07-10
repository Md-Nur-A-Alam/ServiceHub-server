import { Request, Response, NextFunction } from "express";

export const upload = (req: Request, res: Response, next: NextFunction) => {
  next();
};
