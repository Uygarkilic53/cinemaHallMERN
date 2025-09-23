import * as hallController from "../controllers/hallController.js";
import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-hall", protect, adminOnly, hallController.createHall);

router.get("/get-halls", hallController.getHalls);

router.get("/get-hall/:id", hallController.getHallById);

router.put("/update-hall/:id", protect, adminOnly, hallController.updateHall);

router.delete(
  "/delete-hall/:id",
  protect,
  adminOnly,
  hallController.deleteHall
);

router.post("/seed-halls", protect, adminOnly, hallController.seedHalls);

export default router;
