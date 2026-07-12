import { Router } from "express";
import { createBooking, getBookings, updateBookingStatus, getTakenSlots } from "../../controllers/booking.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

// Publicly check taken slots for booking flow
router.get("/taken-slots", getTakenSlots);

// Secure booking operations
router.use(requireAuth);
router.post("/", createBooking);
router.get("/", getBookings);
router.patch("/:id", updateBookingStatus);

export default router;
