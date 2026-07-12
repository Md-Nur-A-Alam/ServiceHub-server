"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const Service_1 = require("../models/Service");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
    apiVersion: "2026-06-24.dahlia",
});
const createPaymentIntent = async (req, res) => {
    try {
        const { serviceId } = req.body;
        if (!serviceId) {
            return res.status(400).json({ success: false, message: "serviceId is required" });
        }
        const service = await Service_1.Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }
        // Amount should be in cents
        const amount = Math.round(service.price * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            metadata: {
                serviceId: service._id.toString(),
                serviceTitle: service.title,
            },
        });
        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createPaymentIntent = createPaymentIntent;
