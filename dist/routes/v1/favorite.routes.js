"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favorite_controller_1 = require("../../controllers/favorite.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.requireAuth, favorite_controller_1.addFavorite);
router.get("/", auth_middleware_1.requireAuth, favorite_controller_1.getUserFavorites);
router.delete("/:serviceId", auth_middleware_1.requireAuth, favorite_controller_1.removeFavorite);
exports.default = router;
