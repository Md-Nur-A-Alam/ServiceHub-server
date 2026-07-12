import { Router } from "express";
import { getServices, getServiceById, createService, getMyServices } from "../../controllers/service.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", getServices);
router.get("/me", requireAuth, getMyServices);
router.get("/:id", getServiceById);
router.post("/", requireAuth, createService);

export default router;
