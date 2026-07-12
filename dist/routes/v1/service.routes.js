"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../../controllers/service.controller");
const router = (0, express_1.Router)();
router.get("/", service_controller_1.getServices);
router.get("/:id", service_controller_1.getServiceById);
exports.default = router;
