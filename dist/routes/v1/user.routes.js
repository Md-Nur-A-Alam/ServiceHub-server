"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const userHelper_1 = require("../../utils/userHelper");
const Service_1 = __importDefault(require("../../models/Service"));
const Notification_1 = __importDefault(require("../../models/Notification"));
const router = (0, express_1.Router)();
// GET all notifications for the current user
router.get("/me/notifications", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification_1.default.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
        res.status(200).json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        next(error);
    }
});
// PATCH mark all notifications as read
router.patch("/me/notifications/mark-read", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        await Notification_1.default.updateMany({ userId, read: false }, { $set: { read: true } });
        res.status(200).json({
            success: true,
            message: "Notifications marked as read"
        });
    }
    catch (error) {
        next(error);
    }
});
// GET all wishlisted services populated
router.get("/me/wishlist", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userProfile = await userHelper_1.userHelper.findById(userId);
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: { message: "User not found." }
            });
        }
        const savedServiceIds = userProfile.savedServices || [];
        // Find all services that are approved and in the user's savedServices
        const services = await Service_1.default.find({
            _id: { $in: savedServiceIds },
            status: "approved"
        }).lean();
        // Fetch provider profiles to map providerName
        const providerIds = Array.from(new Set(services.map((s) => s.providerId).filter(Boolean)));
        const providers = await userHelper_1.userHelper.findManyByIds(providerIds);
        const providerMap = new Map(providers.map(p => [p.id, p]));
        const formatted = services.map((s) => {
            const provider = providerMap.get(s.providerId);
            return {
                ...s,
                id: s._id,
                providerName: provider?.name || "Unknown Provider"
            };
        });
        res.status(200).json({
            success: true,
            data: formatted
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/me/wishlist/:serviceId", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const serviceId = req.params.serviceId;
        const userId = req.user.id;
        // Verify service exists
        const service = await Service_1.default.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                error: { message: "Service not found." }
            });
        }
        const userProfile = await userHelper_1.userHelper.findById(userId);
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: { message: "User not found." }
            });
        }
        const currentSaved = userProfile.savedServices || [];
        let updatedSaved = [];
        if (currentSaved.includes(serviceId)) {
            updatedSaved = currentSaved.filter((id) => id !== serviceId);
        }
        else {
            updatedSaved = [...currentSaved, serviceId];
        }
        await userHelper_1.userHelper.updateProfile(userId, { savedServices: updatedSaved });
        res.status(200).json({
            success: true,
            data: {
                wishlist: updatedSaved,
                active: !currentSaved.includes(serviceId)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
