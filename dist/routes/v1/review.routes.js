"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../../controllers/review.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET reviews of a service is public
router.get("/service/:serviceId", review_controller_1.getServiceReviews);
// Submitting reviews and replies require auth
router.post("/", auth_middleware_1.requireAuth, review_controller_1.createReview);
router.patch("/:id/reply", auth_middleware_1.requireAuth, review_controller_1.replyToReview);
exports.default = router;
