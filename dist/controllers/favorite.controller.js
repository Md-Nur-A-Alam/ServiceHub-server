"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFavorites = exports.removeFavorite = exports.addFavorite = void 0;
const Favorite_1 = require("../models/Favorite");
// Add a service to favorites
const addFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { serviceId } = req.body;
        if (!userId)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!serviceId)
            return res.status(400).json({ success: false, message: "serviceId is required" });
        // Check if already favorited
        const existing = await Favorite_1.Favorite.findOne({ userId, serviceId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Already in favorites" });
        }
        const favorite = await Favorite_1.Favorite.create({ userId, serviceId });
        res.status(201).json({ success: true, data: favorite });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.addFavorite = addFavorite;
// Remove a service from favorites
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { serviceId } = req.params;
        if (!userId)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const deleted = await Favorite_1.Favorite.findOneAndDelete({ userId, serviceId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Favorite not found" });
        }
        res.status(200).json({ success: true, message: "Removed from favorites" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.removeFavorite = removeFavorite;
// Get all favorites for the logged-in user
const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const favorites = await Favorite_1.Favorite.find({ userId })
            .populate("serviceId")
            .sort({ createdAt: -1 });
        // Extract the populated service documents, filtering out nulls (deleted services)
        const services = favorites
            .map((f) => f.serviceId)
            .filter((s) => s != null);
        res.status(200).json({ success: true, data: services });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserFavorites = getUserFavorites;
