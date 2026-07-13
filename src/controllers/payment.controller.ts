import { Request, Response } from "express";
import Stripe from "stripe";
import { Service } from "../models/Service";
import { Booking } from "../models/Booking";
import { userHelper } from "../utils/userHelper";
import { notificationService } from "../services/notification.service";
import { sendEmail } from "../services/email.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-06-24.dahlia" as any,
});

export const createPaymentIntent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { serviceId, date, timeSlot, notes } = req.body;
    const customerId = (req as any).user?.id;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: "serviceId is required" });
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: "date and timeSlot are required" });
    }

    if (!customerId) {
       return res.status(401).json({ success: false, message: "Unauthorized" });
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
        customerId,
        date,
        timeSlot,
        notes: notes || "",
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

export const stripeWebhook = async (req: Request, res: Response): Promise<any> => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    if (metadata && metadata.serviceId && metadata.customerId) {
      try {
        const service = await Service.findById(metadata.serviceId);
        if (service) {
          // Check if already created (webhook idempotency)
          const existing = await Booking.findOne({ paymentIntentId: paymentIntent.id });
          if (!existing) {
            const booking = new Booking({
              serviceId: metadata.serviceId,
              customerId: metadata.customerId,
              providerId: service.providerId,
              date: new Date(metadata.date),
              timeSlot: metadata.timeSlot,
              price: service.price,
              notes: metadata.notes,
              status: "pending",
              paymentIntentId: paymentIntent.id
            });
            await booking.save();

            // Trigger notifications
            const providerProfile = await userHelper.findById(service.providerId);
            const customerProfile = await userHelper.findById(metadata.customerId);
            const customerName = customerProfile?.name || "A customer";
            
            await notificationService.sendNotification({
              userId: service.providerId,
              type: "booking_created",
              message: `${customerName} booked "${service.title}" and paid securely.`,
              link: `/bookings`
            });

            if (providerProfile?.email) {
              await sendEmail({
                to: providerProfile.email,
                subject: `New Secure Booking Request for ${service.title}`,
                html: `
                  <h3>New Booking Request</h3>
                  <p>Hi ${providerProfile.name},</p>
                  <p>You have a new paid booking request for <strong>${service.title}</strong>.</p>
                  <p><strong>Customer:</strong> ${customerName}</p>
                  <p><strong>Date:</strong> ${new Date(metadata.date).toLocaleDateString()}</p>
                  <p><strong>Time Slot:</strong> ${metadata.timeSlot}</p>
                  <a href="${process.env.CLIENT_URL}/bookings">View Booking on ServiceHub</a>
                `
              });
            }
          }
        }
      } catch (dbErr) {
        console.error("Error creating booking from webhook:", dbErr);
      }
    }
  }

  res.json({ received: true });
};
