"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUsers = exports.getAdminServices = exports.getAuditLogs = exports.banUser = exports.updateServiceStatus = exports.getAnalytics = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const Service_1 = __importDefault(require("../models/Service"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const userHelper_1 = require("../utils/userHelper");
const mongo_client_1 = require("../config/mongo-client");
const notification_service_1 = require("../services/notification.service");
const getAnalytics = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        sixtyDaysAgo.setUTCHours(0, 0, 0, 0);
        // 1. Bookings per day aggregation
        const bookingsPerDay = await Booking_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        // 2. Revenue total + trend
        const revenueCurrent = await Booking_1.default.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$price" }
                }
            }
        ]);
        const revenuePrevious = await Booking_1.default.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$price" }
                }
            }
        ]);
        const currentTotal = revenueCurrent[0]?.total || 0;
        const previousTotal = revenuePrevious[0]?.total || 0;
        const trendPercent = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;
        // 3. Category breakdown
        const categoryBreakdown = await Booking_1.default.aggregate([
            {
                $lookup: {
                    from: "services",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $group: {
                    _id: "$service.category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        // Format bookings per day for the frontend
        const dailyMap = new Map(bookingsPerDay.map(b => [b._id, b.count]));
        const formattedDaily = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            formattedDaily.push({
                date: dateStr,
                bookings: dailyMap.get(dateStr) || 0
            });
        }
        // Global stats cards count
        const totalBookings = await Booking_1.default.countDocuments();
        const totalServices = await Service_1.default.countDocuments();
        const totalUsers = await mongo_client_1.db.collection("user").countDocuments();
        const pendingServices = await Service_1.default.countDocuments({ status: "pending" });
        res.status(200).json({
            success: true,
            data: {
                bookingsPerDay: formattedDaily,
                revenue: {
                    total: currentTotal,
                    trend: trendPercent
                },
                categoryBreakdown: categoryBreakdown.map(c => ({
                    category: c._id,
                    count: c.count
                })),
                stats: {
                    totalBookings,
                    totalServices,
                    totalUsers,
                    pendingServices
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
const updateServiceStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body; // approved, rejected
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: "Invalid status. Must be 'approved' or 'rejected'." }
            });
        }
        const service = await Service_1.default.findById(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                error: { message: "Service not found." }
            });
        }
        service.status = status;
        await service.save();
        // Create Audit Log
        const auditLog = new AuditLog_1.default({
            adminId: req.user.id,
            action: `${status}_service`,
            targetType: "Service",
            targetId: id
        });
        await auditLog.save();
        // Notify Provider
        await notification_service_1.notificationService.sendNotification({
            userId: service.providerId,
            type: "service_moderation",
            message: `Your service "${service.title}" has been ${status} by the administrator.`,
            link: `/provider/services`
        });
        res.status(200).json({
            success: true,
            data: service
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateServiceStatus = updateServiceStatus;
const banUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { banned } = req.body; // boolean
        if (typeof banned !== "boolean") {
            return res.status(400).json({
                success: false,
                error: { message: "Banned parameter must be a boolean value." }
            });
        }
        const userProfile = await userHelper_1.userHelper.findById(id);
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: { message: "User not found." }
            });
        }
        if (userProfile.role === "admin") {
            return res.status(400).json({
                success: false,
                error: { message: "Administrators cannot be banned." }
            });
        }
        await userHelper_1.userHelper.updateProfile(id, { banned });
        // Create Audit Log
        const auditLog = new AuditLog_1.default({
            adminId: req.user.id,
            action: banned ? "ban_user" : "unban_user",
            targetType: "User",
            targetId: id
        });
        await auditLog.save();
        res.status(200).json({
            success: true,
            message: `User status updated. Banned: ${banned}`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.banUser = banUser;
const getAuditLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            AuditLog_1.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AuditLog_1.default.countDocuments()
        ]);
        // Fetch Admin users name / email
        const adminIds = Array.from(new Set(logs.map((l) => l.adminId).filter(Boolean)));
        const admins = await userHelper_1.userHelper.findManyByIds(adminIds);
        const adminMap = new Map(admins.map((a) => [a.id, a]));
        const formatted = logs.map((l) => ({
            ...l,
            admin: adminMap.get(l.adminId) || { name: "Unknown Admin", email: "" }
        }));
        res.status(200).json({
            success: true,
            data: {
                items: formatted,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
// GET /api/v1/admin/services
const getAdminServices = async (req, res, next) => {
    try {
        const services = await Service_1.default.find().sort({ createdAt: -1 }).lean();
        const providerIds = Array.from(new Set(services.map((s) => s.providerId).filter(Boolean)));
        const providers = await userHelper_1.userHelper.findManyByIds(providerIds);
        const providerMap = new Map(providers.map((p) => [p.id, p]));
        const formatted = services.map((s) => ({
            ...s,
            id: s._id,
            provider: providerMap.get(s.providerId) || { name: "Unknown Provider", email: "" }
        }));
        res.status(200).json({
            success: true,
            data: formatted
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminServices = getAdminServices;
// GET /api/v1/admin/users
const getAdminUsers = async (req, res, next) => {
    try {
        const userDocs = await mongo_client_1.db.collection("user").find().toArray();
        const formatted = userDocs.map(doc => userHelper_1.userHelper.mapUserDoc(doc));
        res.status(200).json({
            success: true,
            data: formatted
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUsers = getAdminUsers;
