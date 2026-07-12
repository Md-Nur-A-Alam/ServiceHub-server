"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../../controllers/booking.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Publicly check taken slots for booking flow
router.get("/taken-slots", booking_controller_1.getTakenSlots);
// Secure booking operations
router.use(auth_middleware_1.requireAuth);
router.post("/", booking_controller_1.createBooking);
router.get("/", booking_controller_1.getBookings);
router.patch("/:id", booking_controller_1.updateBookingStatus);
exports.default = router;
