"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceById = exports.getServices = void 0;
const Service_1 = __importDefault(require("../models/Service"));
const userHelper_1 = require("../utils/userHelper");
const getServices = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, location, rating, sort, page = "1", limit = "12", } = req.query;
        const query = { status: "approved" };
        if (search) {
            query.$text = { $search: search };
        }
        if (category) {
            // If multiple categories are passed, this handles it if split by comma, etc.
            // But assuming exact match for now, or $in if it's an array.
            if (typeof category === "string" && category.includes(",")) {
                query.category = { $in: category.split(",").map(c => c.trim().toLowerCase()) };
            }
            else {
                query.category = category.toLowerCase();
            }
        }
        if (location) {
            // Simple regex match for location, or exact match depending on how strict we want to be.
            // Assuming a case-insensitive exact match or partial match.
            query.location = { $regex: location, $options: "i" };
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = Number(minPrice);
            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }
        if (rating) {
            query.ratingAvg = { $gte: Number(rating) };
        }
        let sortObj = { createdAt: -1 }; // newest by default
        if (sort) {
            switch (sort) {
                case "price_asc":
                    sortObj = { price: 1 };
                    break;
                case "price_desc":
                    sortObj = { price: -1 };
                    break;
                case "rating":
                    sortObj = { ratingAvg: -1 };
                    break;
                case "newest":
                    sortObj = { createdAt: -1 };
                    break;
                default:
                    sortObj = { createdAt: -1 };
            }
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const skip = (pageNum - 1) * limitNum;
        // Execute query
        const [items, total] = await Promise.all([
            Service_1.default.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Service_1.default.countDocuments(query),
        ]);
        // Fetch provider profiles manually via userHelper
        const providerIds = Array.from(new Set(items.map((item) => item.providerId).filter(Boolean)));
        const providers = await userHelper_1.userHelper.findManyByIds(providerIds);
        const providerMap = new Map(providers.map((p) => [p.id, p]));
        const totalPages = Math.ceil(total / limitNum);
        // Map the items to match the expected client shape
        const formattedItems = items.map((item) => {
            const provider = providerMap.get(item.providerId);
            return {
                id: item._id,
                title: item.title,
                category: item.category,
                providerName: provider?.name || "Unknown Provider",
                location: item.location,
                price: item.price,
                ratingAvg: item.ratingAvg,
                ratingCount: item.ratingCount,
                imageEmoji: item.images?.[0] || "🏠", // mock emoji if real images aren't there
                shortDesc: item.shortDesc,
            };
        });
        return res.status(200).json({
            success: true,
            data: {
                items: formattedItems,
                total,
                page: pageNum,
                totalPages,
            },
        });
    }
    catch (error) {
        console.error("Error fetching services:", error);
        return res.status(500).json({ success: false, message: "Server error fetching services" });
    }
};
exports.getServices = getServices;
const getServiceById = async (req, res) => {
    try {
        const id = req.params.id;
        const service = await Service_1.default.findById(id).lean();
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }
        const provider = await userHelper_1.userHelper.findById(service.providerId);
        const formatted = {
            id: service._id,
            title: service.title,
            shortDesc: service.shortDesc,
            fullDesc: service.fullDesc,
            category: service.category,
            providerId: service.providerId,
            providerName: provider?.name || "Unknown Provider",
            providerEmail: provider?.email || "",
            providerBio: provider?.provider?.bio || "",
            location: service.location,
            price: service.price,
            ratingAvg: service.ratingAvg,
            ratingCount: service.ratingCount,
            imageEmoji: service.images?.[0] || "🏠",
            images: service.images || [],
            status: service.status
        };
        return res.status(200).json({
            success: true,
            data: formatted
        });
    }
    catch (error) {
        console.error("Error fetching service by ID:", error);
        return res.status(500).json({ success: false, message: "Server error fetching service details" });
    }
};
exports.getServiceById = getServiceById;
