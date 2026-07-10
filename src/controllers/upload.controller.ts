import { Request, Response } from "express";

export const uploadFile = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Upload file placeholder" });
};
