import { Request, Response, NextFunction } from "express";
import Review from "../models/Review";
import Booking from "../models/Booking";
import Service from "../models/Service";
import { userHelper, UserProfile } from "../utils/userHelper";

export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { serviceId, bookingId, rating, comment, images } = req.body;
    const userId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        error: { message: "Only customers can submit reviews." }
      });
    }

    if (!serviceId || !bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: { message: "Service ID, booking ID, rating, and comment are required." }
      });
    }

    // Verify booking is completed and owned by this user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: "Booking not found." }
      });
    }

    if (booking.customerId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "You can only review bookings that you placed." }
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: { message: "You can only review a booking that is completed." }
      });
    }

    if (booking.serviceId.toString() !== serviceId) {
      return res.status(400).json({
        success: false,
        error: { message: "Booking service ID does not match requested service." }
      });
    }

    // Application level check for unique reviews per booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: { message: "You have already reviewed this booking." }
      });
    }

    const review = new Review({
      serviceId,
      userId,
      bookingId,
      rating,
      comment,
      images: images || []
    });

    await review.save();

    // Recalculate average rating and count for the service
    const reviews = await Review.find({ serviceId });
    const count = reviews.length;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await Service.findByIdAndUpdate(serviceId, {
      ratingAvg: Math.round(avg * 10) / 10,
      ratingCount: count
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: { message: "A review for this booking already exists." }
      });
    }
    next(error);
  }
};

export const replyToReview = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { providerReply } = req.body;
    const userId = req.user.id;

    if (req.user.role !== "provider") {
      return res.status(403).json({
        success: false,
        error: { message: "Only providers can reply to reviews." }
      });
    }

    if (!providerReply || providerReply.trim() === "") {
      return res.status(400).json({
        success: false,
        error: { message: "Reply comment cannot be empty." }
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: { message: "Review not found." }
      });
    }

    const service = await Service.findById(review.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: "Service associated with this review not found." }
      });
    }

    if (service.providerId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "You are not authorized to reply to this review (not the owner of this service)." }
      });
    }

    review.providerReply = providerReply.trim();
    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// GET endpoint to fetch reviews for a service
export const getServiceReviews = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const serviceId = req.params.serviceId as string;
    const reviews = await Review.find({ serviceId }).sort({ createdAt: -1 }).lean();

    // Fetch user info for each review writer
    const userIds = Array.from(new Set(reviews.map((r: any) => r.userId)));
    const users = await userHelper.findManyByIds(userIds);
    const userMap = new Map(users.map((u: UserProfile) => [u.id, u]));

    const formatted = reviews.map((r: any) => ({
      ...r,
      user: userMap.get(r.userId) || { name: "Anonymous", avatarUrl: null }
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
