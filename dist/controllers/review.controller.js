"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyReviews = exports.getServiceReviews = exports.replyToReview = exports.createReview = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Service_1 = __importDefault(require("../models/Service"));
const userHelper_1 = require("../utils/userHelper");
const createReview = async (req, res, next) => {
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
        const booking = await Booking_1.default.findById(bookingId);
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
        const existingReview = await Review_1.default.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: { message: "You have already reviewed this booking." }
            });
        }
        const review = new Review_1.default({
            serviceId,
            userId,
            bookingId,
            rating,
            comment,
            images: images || []
        });
        await review.save();
        // Recalculate average rating and count for the service
        const reviews = await Review_1.default.find({ serviceId });
        const count = reviews.length;
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;
        await Service_1.default.findByIdAndUpdate(serviceId, {
            ratingAvg: Math.round(avg * 10) / 10,
            ratingCount: count
        });
        res.status(201).json({
            success: true,
            data: review
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: { message: "A review for this booking already exists." }
            });
        }
        next(error);
    }
};
exports.createReview = createReview;
const replyToReview = async (req, res, next) => {
    try {
        const id = req.params.id;
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
        const review = await Review_1.default.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                error: { message: "Review not found." }
            });
        }
        const service = await Service_1.default.findById(review.serviceId);
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
    }
    catch (error) {
        next(error);
    }
};
exports.replyToReview = replyToReview;
// GET endpoint to fetch reviews for a service
const getServiceReviews = async (req, res, next) => {
    try {
        const serviceId = req.params.serviceId;
        const reviews = await Review_1.default.find({ serviceId }).sort({ createdAt: -1 }).lean();
        // Fetch user info for each review writer
        const userIds = Array.from(new Set(reviews.map((r) => r.userId)));
        const users = await userHelper_1.userHelper.findManyByIds(userIds);
        const userMap = new Map(users.map((u) => [u.id, u]));
        const formatted = reviews.map((r) => ({
            ...r,
            user: userMap.get(r.userId) || { name: "Anonymous", avatarUrl: null }
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
exports.getServiceReviews = getServiceReviews;
const getMyReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let reviews = [];
        if (role === "customer") {
            reviews = await Review_1.default.find({ userId }).sort({ createdAt: -1 }).lean();
        }
        else if (role === "provider") {
            const services = await Service_1.default.find({ providerId: userId }).select("_id").lean();
            const serviceIds = services.map((s) => s._id);
            reviews = await Review_1.default.find({ serviceId: { $in: serviceIds } }).sort({ createdAt: -1 }).lean();
        }
        else if (role === "admin") {
            reviews = await Review_1.default.find().sort({ createdAt: -1 }).lean();
        }
        else {
            return res.status(403).json({
                success: false,
                error: { message: "Invalid role." }
            });
        }
        const userIds = Array.from(new Set(reviews.map((r) => r.userId)));
        const serviceIds = Array.from(new Set(reviews.map((r) => r.serviceId)));
        const [users, services] = await Promise.all([
            userHelper_1.userHelper.findManyByIds(userIds),
            Service_1.default.find({ _id: { $in: serviceIds } }).select("title images").lean()
        ]);
        const userMap = new Map(users.map((u) => [u.id, u]));
        const serviceMap = new Map(services.map((s) => [s._id.toString(), s]));
        const formatted = reviews.map((r) => ({
            ...r,
            user: userMap.get(r.userId) || { name: "Anonymous", avatarUrl: null },
            service: serviceMap.get(r.serviceId.toString()) || null
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
exports.getMyReviews = getMyReviews;
