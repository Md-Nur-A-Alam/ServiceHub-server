import { Router } from "express";
import { createReview, replyToReview, getServiceReviews } from "../../controllers/review.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

// GET reviews of a service is public
router.get("/service/:serviceId", getServiceReviews);

// Submitting reviews and replies require auth
router.post("/", requireAuth, createReview);
router.patch("/:id/reply", requireAuth, replyToReview);

export default router;
