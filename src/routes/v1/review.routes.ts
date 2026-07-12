import { Router } from "express";
import { createReview, replyToReview, getServiceReviews, getMyReviews } from "../../controllers/review.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

// GET reviews of a service is public
router.get("/service/:serviceId", getServiceReviews);

// Submitting reviews and replies require auth
router.use(requireAuth);
router.get("/user/me", getMyReviews);
router.post("/", createReview);
router.patch("/:id/reply", replyToReview);

export default router;

