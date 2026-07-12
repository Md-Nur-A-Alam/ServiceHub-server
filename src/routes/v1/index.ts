import { Router } from "express";
import authRoutes from "./auth.routes";
import serviceRoutes from "./service.routes";
import bookingRoutes from "./booking.routes";
import reviewRoutes from "./review.routes";
import adminRoutes from "./admin.routes";
import uploadRoutes from "./upload.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);
router.use("/users", userRoutes);

export default router;
