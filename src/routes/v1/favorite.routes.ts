import express from "express";
import { addFavorite, removeFavorite, getUserFavorites } from "../../controllers/favorite.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = express.Router();

router.post("/", requireAuth, addFavorite);
router.get("/", requireAuth, getUserFavorites);
router.delete("/:serviceId", requireAuth, removeFavorite);

export default router;
