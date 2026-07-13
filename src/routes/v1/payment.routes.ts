import express from "express";
import { createPaymentIntent, stripeWebhook } from "../../controllers/payment.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = express.Router();

router.post("/create-intent", requireAuth, createPaymentIntent);
router.post("/webhook", stripeWebhook);

export default router;
