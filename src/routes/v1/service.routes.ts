import { Router } from "express";
import { getServices, getServiceById, createService, getProviderServices, updateService, deleteService } from "../../controllers/service.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", getServices);
router.get("/provider/me", requireAuth, getProviderServices);
router.get("/:id", getServiceById);
router.post("/", requireAuth, createService);
router.patch("/:id", requireAuth, updateService);
router.delete("/:id", requireAuth, deleteService);

export default router;

