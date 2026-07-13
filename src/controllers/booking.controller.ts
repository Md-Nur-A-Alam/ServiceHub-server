import { Request, Response, NextFunction } from "express";
import Booking from "../models/Booking";
import Service from "../models/Service";
import { userHelper } from "../utils/userHelper";
import { notificationService } from "../services/notification.service";
import { sendEmail } from "../services/email.service";

/**
 * Normalizes a date to start/end of UTC day for strict matching
 */
const getDayRange = (dateStr: string | Date) => {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

export const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { serviceId, date, timeSlot, notes } = req.body;
    const customerId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        error: { message: "Only customers can book services." }
      });
    }

    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: { message: "Service ID, date, and time slot are required." }
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: "Service not found." }
      });
    }

    if (service.status !== "approved") {
      return res.status(400).json({
        success: false,
        error: { message: "This service is not available for booking." }
      });
    }

    // Check if slot is already taken by a non-cancelled booking
    const { start, end } = getDayRange(date);
    const existingBooking = await Booking.findOne({
      serviceId,
      date: { $gte: start, $lte: end },
      timeSlot,
      status: { $ne: "cancelled" }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: { message: "This time slot has already been booked." }
      });
    }

    const booking = new Booking({
      serviceId,
      customerId,
      providerId: service.providerId,
      date: new Date(date),
      timeSlot,
      price: service.price,
      notes,
      status: "pending"
    });

    await booking.save();

    // Trigger notification to Provider
    const providerProfile = await userHelper.findById(service.providerId);
    const customerName = req.user.name || "A customer";
    
    await notificationService.sendNotification({
      userId: service.providerId,
      type: "booking_created",
      message: `${customerName} booked "${service.title}" on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      link: `/bookings`
    });

    if (providerProfile?.email) {
      await sendEmail({
        to: providerProfile.email,
        subject: `New Booking Request for ${service.title}`,
        html: `
          <h3>New Booking Request</h3>
          <p>Hi ${providerProfile.name},</p>
          <p>You have a new booking request for <strong>${service.title}</strong>.</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
          <p><strong>Time Slot:</strong> ${timeSlot}</p>
          <a href="${process.env.CLIENT_URL}/bookings">View Booking on ServiceHub</a>
        `
      });
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let query: any = {};

    if (role === "customer") {
      query.customerId = userId;
    } else if (role === "provider") {
      query.providerId = userId;
    } else if (role === "admin") {
      // Admins can see all if they request, but filter by query params if present
      if (req.query.customerId) query.customerId = req.query.customerId;
      if (req.query.providerId) query.providerId = req.query.providerId;
    } else {
      return res.status(403).json({
        success: false,
        error: { message: "Invalid role." }
      });
    }

    const bookings = await Booking.find(query)
      .populate({ path: "serviceId", model: "Service" })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user profiles to attach metadata
    const customerIds = Array.from(new Set(bookings.map((b: any) => b.customerId)));
    const providerIds = Array.from(new Set(bookings.map((b: any) => b.providerId)));
    const [customers, providers] = await Promise.all([
      userHelper.findManyByIds(customerIds),
      userHelper.findManyByIds(providerIds)
    ]);

    const customerMap = new Map(customers.map(c => [c.id, c]));
    const providerMap = new Map(providers.map(p => [p.id, p]));

    const formatted = bookings.map((b: any) => ({
      ...b,
      customer: customerMap.get(b.customerId) || null,
      provider: providerMap.get(b.providerId) || null
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // confirmed, completed, cancelled
    const userId = req.user.id;
    const role = req.user.role;

    const booking = await Booking.findById(id).populate({ path: "serviceId", model: "Service" });
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found." }
      });
    }

    // Enforce role and state transitions
    if (role === "provider") {
      if (booking.providerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: "You are not authorized to manage this booking." }
        });
      }
      
      const current = booking.status;
      if (current === "pending" && (status === "confirmed" || status === "cancelled")) {
        booking.status = status;
      } else if (current === "confirmed" && (status === "completed" || status === "cancelled")) {
        booking.status = status;
      } else {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid transition from "${current}" to "${status}" as a provider.` }
        });
      }
    } else if (role === "customer") {
      // Customers can cancel if pending
      if (booking.customerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: "You are not authorized to manage this booking." }
        });
      }

      if (booking.status === "pending" && status === "cancelled") {
        booking.status = "cancelled";
      } else {
        return res.status(400).json({
          success: false,
          error: { message: "Customers can only cancel a pending booking." }
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        error: { message: "Unauthorized role." }
      });
    }

    await booking.save();

    // Trigger Notification, Pusher event, and Email
    const targetUserId = role === "provider" ? booking.customerId : booking.providerId;
    const targetProfile = await userHelper.findById(targetUserId);
    const serviceTitle = (booking.serviceId as any)?.title || "your service";

    let messageText = "";
    if (booking.status === "confirmed") {
      messageText = `Your booking for "${serviceTitle}" has been confirmed!`;
    } else if (booking.status === "cancelled") {
      messageText = `Your booking for "${serviceTitle}" has been cancelled.`;
    } else if (booking.status === "completed") {
      messageText = `Your booking for "${serviceTitle}" is marked as completed. Please leave a review!`;
    }

    await notificationService.sendNotification({
      userId: targetUserId,
      type: "booking_status_updated",
      message: messageText,
      link: `/bookings`
    });

    if (targetProfile?.email) {
      await sendEmail({
        to: targetProfile.email,
        subject: `Booking Status Updated: ${booking.status.toUpperCase()}`,
        html: `
          <h3>Booking Status Update</h3>
          <p>Hi ${targetProfile.name},</p>
          <p>The status of your booking for <strong>${serviceTitle}</strong> has been updated to <strong>${booking.status.toUpperCase()}</strong>.</p>
          <p>${messageText}</p>
          <a href="${process.env.CLIENT_URL}/bookings">View Booking</a>
        `
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const getTakenSlots = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const serviceId = req.query.serviceId as string;
    const dateStr = req.query.date as string;

    if (!serviceId || !dateStr) {
      return res.status(400).json({
        success: false,
        error: { message: "Service ID and date are required query parameters." }
      });
    }

    const { start, end } = getDayRange(dateStr);
    const bookings = await Booking.find({
      serviceId,
      date: { $gte: start, $lte: end },
      status: { $ne: "cancelled" }
    }).select("timeSlot").lean();

    const takenSlots = bookings.map((b: any) => b.timeSlot);

    res.status(200).json({
      success: true,
      data: takenSlots
    });
  } catch (error) {
    next(error);
  }
};
