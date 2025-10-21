import * as reservationController from "../controllers/reservationController.js";
import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-reservation",
  protect,
  reservationController.createReservation
);

router.post(
  "/confirm-reservation",
  protect,
  reservationController.confirmReservation
);

router.post(
  "/cancel-reservation/:id",
  protect,
  reservationController.cancelReservation
);

router.get(
  "/my-reservations",
  protect,
  reservationController.getMyReservations
);

router.patch("/:id/cancel", protect, reservationController.cancelReservation);

//admin
router.get(
  "/get-reservations",
  protect,
  adminOnly,
  reservationController.getReservations
);

router.delete(
  "/delete-reservation/:id",
  protect,
  adminOnly,
  reservationController.deleteReservation
);

export default router;
