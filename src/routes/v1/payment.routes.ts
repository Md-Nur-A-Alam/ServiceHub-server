import express from "express";
import { createPaymentIntent } from "../../controllers/payment.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = express.Router();

router.post("/create-intent", requireAuth, createPaymentIntent);

export default router;
