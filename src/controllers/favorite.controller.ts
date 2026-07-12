import { Request, Response } from "express";
import { Favorite } from "../models/Favorite";

// Add a service to favorites
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!serviceId) return res.status(400).json({ success: false, message: "serviceId is required" });

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, serviceId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already in favorites" });
    }

    const favorite = await Favorite.create({ userId, serviceId });
    res.status(201).json({ success: true, data: favorite });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a service from favorites
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const deleted = await Favorite.findOneAndDelete({ userId, serviceId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Favorite not found" });
    }

    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all favorites for the logged-in user
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const favorites = await Favorite.find({ userId })
      .populate("serviceId")
      .sort({ createdAt: -1 });

    // Extract the populated service documents, filtering out nulls (deleted services)
    const services = favorites
      .map((f) => f.serviceId)
      .filter((s) => s != null);

    res.status(200).json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
