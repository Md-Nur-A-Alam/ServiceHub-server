import { Request, Response } from "express";

export const getAnalytics = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Admin analytics placeholder" });
};
