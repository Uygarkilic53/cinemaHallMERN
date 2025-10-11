import express from "express";
import * as authController from "../controllers/authController.js";
import {
  signupValidation,
  validateLogin,
} from "../validations/authValidations.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/signup",
  signupValidation,
  validateRequest,
  authController.signup
);

router.post("/login", validateLogin, authController.login);

router.post(
  "/createuser",
  signupValidation,
  validateRequest,
  protect,
  adminOnly,
  authController.createUser
);

router.delete("/deleteuser/:id", protect, adminOnly, authController.deleteUser);

router.put(
  "/updateuser/:id",
  signupValidation,
  validateRequest,
  protect,
  adminOnly,
  authController.updateUser
);

router.get("/users", protect, adminOnly, authController.getAllUsers);

router.get("/profile", protect, authController.getProfile);

router.post("/forgot-password", authController.forgotPassword);

router.get("/verify-reset-token/:token", authController.verifyResetToken);

router.post("/reset-password/:token", authController.resetPassword);

export default router;
