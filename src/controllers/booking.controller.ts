import { Request, Response } from "express";

export const createBooking = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Create booking placeholder" });
};
