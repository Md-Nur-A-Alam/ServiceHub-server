import { Request, Response } from "express";
import Stripe from "stripe";
import { Service } from "../models/Service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-06-24.dahlia",
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: "serviceId is required" });
    }

    const service = await Service.findById(serviceId);
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
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
