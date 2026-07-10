import { Request, Response } from "express";

export const createReview = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Create review placeholder" });
};
