import { Router } from "express";
import {
  getAnalytics,
  updateServiceStatus,
  banUser,
  getAuditLogs,
  getAdminServices,
  getAdminUsers,
  getAdminBookings,
} from "../../controllers/admin.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();

// Apply auth and admin check to all admin routes
router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/analytics", getAnalytics);
router.patch("/services/:id/status", updateServiceStatus);
router.patch("/users/:id/ban", banUser);
router.get("/audit-log", getAuditLogs);
router.get("/services", getAdminServices);
router.get("/users", getAdminUsers);
router.get("/bookings", getAdminBookings);

export default router;
