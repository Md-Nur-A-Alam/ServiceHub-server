import { Request, Response } from "express";

export const getServices = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Get services placeholder" });
};
