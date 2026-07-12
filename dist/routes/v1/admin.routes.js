"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../../controllers/admin.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Apply auth and admin check to all admin routes
router.use(auth_middleware_1.requireAuth);
router.use((0, rbac_middleware_1.requireRole)("admin"));
router.get("/analytics", admin_controller_1.getAnalytics);
router.patch("/services/:id/status", admin_controller_1.updateServiceStatus);
router.patch("/users/:id/ban", admin_controller_1.banUser);
router.get("/audit-log", admin_controller_1.getAuditLogs);
router.get("/services", admin_controller_1.getAdminServices);
router.get("/users", admin_controller_1.getAdminUsers);
exports.default = router;
