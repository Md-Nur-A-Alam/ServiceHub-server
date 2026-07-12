import { Request, Response, NextFunction } from "express";
import Booking from "../models/Booking";
import Service from "../models/Service";
import AuditLog from "../models/AuditLog";
import { userHelper, UserProfile } from "../utils/userHelper";
import { db } from "../config/mongo-client";
import { notificationService } from "../services/notification.service";

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    sixtyDaysAgo.setUTCHours(0, 0, 0, 0);

    // 1. Bookings per day aggregation
    const bookingsPerDay = await Booking.aggregate([
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
    const revenueCurrent = await Booking.aggregate([
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

    const revenuePrevious = await Booking.aggregate([
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
    const categoryBreakdown = await Booking.aggregate([
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
    const totalBookings = await Booking.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalUsers = await db.collection("user").countDocuments();
    const pendingServices = await Service.countDocuments({ status: "pending" });

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
  } catch (error) {
    next(error);
  }
};

export const updateServiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // approved, rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid status. Must be 'approved' or 'rejected'." }
      });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: "Service not found." }
      });
    }

    service.status = status;
    await service.save();

    // Create Audit Log
    const auditLog = new AuditLog({
      adminId: req.user.id as string,
      action: `${status}_service`,
      targetType: "Service",
      targetId: id
    });
    await auditLog.save();

    // Notify Provider
    await notificationService.sendNotification({
      userId: service.providerId,
      type: "service_moderation",
      message: `Your service "${service.title}" has been ${status} by the administrator.`,
      link: `/provider/services`
    });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { banned } = req.body; // boolean

    if (typeof banned !== "boolean") {
      return res.status(400).json({
        success: false,
        error: { message: "Banned parameter must be a boolean value." }
      });
    }

    const userProfile = await userHelper.findById(id);
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

    await userHelper.updateProfile(id, { banned });

    // Create Audit Log
    const auditLog = new AuditLog({
      adminId: req.user.id as string,
      action: banned ? "ban_user" : "unban_user",
      targetType: "User",
      targetId: id
    });
    await auditLog.save();

    res.status(200).json({
      success: true,
      message: `User status updated. Banned: ${banned}`
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments()
    ]);

    // Fetch Admin users name / email
    const adminIds = Array.from(new Set(logs.map((l: any) => l.adminId as string).filter(Boolean)));
    const admins = await userHelper.findManyByIds(adminIds);
    const adminMap = new Map(admins.map((a: UserProfile) => [a.id, a]));

    const formatted = logs.map((l: any) => ({
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
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/services
export const getAdminServices = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();
    
    const providerIds = Array.from(new Set(services.map((s: any) => s.providerId as string).filter(Boolean)));
    const providers = await userHelper.findManyByIds(providerIds);
    const providerMap = new Map(providers.map((p: UserProfile) => [p.id, p]));

    const formatted = services.map((s: any) => ({
      ...s,
      id: s._id,
      provider: providerMap.get(s.providerId) || { name: "Unknown Provider", email: "" }
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/users
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userDocs = await db.collection("user").find().toArray();
    const formatted = userDocs.map(doc => userHelper.mapUserDoc(doc));
    
    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
