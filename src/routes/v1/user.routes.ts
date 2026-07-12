import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { userHelper } from "../../utils/userHelper";
import Service from "../../models/Service";
import Notification from "../../models/Notification";

const router = Router();

// GET all notifications for the current user
router.get("/me/notifications", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

// PATCH mark all notifications as read
router.patch("/me/notifications/mark-read", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.status(200).json({
      success: true,
      message: "Notifications marked as read"
    });
  } catch (error) {
    next(error);
  }
});

// GET all wishlisted services populated
router.get("/me/wishlist", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    const userProfile = await userHelper.findById(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found." }
      });
    }

    const savedServiceIds = userProfile.savedServices || [];
    
    // Find all services that are approved and in the user's savedServices
    const services = await Service.find({
      _id: { $in: savedServiceIds },
      status: "approved"
    }).lean();

    // Fetch provider profiles to map providerName
    const providerIds = Array.from(new Set(services.map((s: any) => s.providerId).filter(Boolean)));
    const providers = await userHelper.findManyByIds(providerIds as string[]);
    const providerMap = new Map(providers.map(p => [p.id, p]));

    const formatted = services.map((s: any) => {
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
  } catch (error) {
    next(error);
  }
});

router.patch("/me/wishlist/:serviceId", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const serviceId = req.params.serviceId as string;
    const userId = req.user.id as string;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: "Service not found." }
      });
    }

    const userProfile = await userHelper.findById(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found." }
      });
    }

    const currentSaved: string[] = userProfile.savedServices || [];
    let updatedSaved: string[] = [];

    if (currentSaved.includes(serviceId)) {
      updatedSaved = currentSaved.filter((id: string) => id !== serviceId);
    } else {
      updatedSaved = [...currentSaved, serviceId];
    }

    await userHelper.updateProfile(userId, { savedServices: updatedSaved });

    res.status(200).json({
      success: true,
      data: {
        wishlist: updatedSaved,
        active: !currentSaved.includes(serviceId)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
