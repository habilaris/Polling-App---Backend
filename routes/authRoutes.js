import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  changePassword,
  deleteAccount,
  getMe,
  register,
  resendOtp,
  updateProfile,
  verifyOtp,
  login,
} from "../controllers/authController.js";
import {
  forgotPassword,
  resetPassword,
  verifyResetOtp,
} from "../controllers/passwordController.js";

import { protect } from "../middleware/auth.js";

const authRouter = express.Router();

// Test route
authRouter.get("/", (req, res) => {
  res.send("Welcome to api/auth/");
});

authRouter.post("/register", upload.single("image"), register);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/login", login);
authRouter.get("/me", protect, getMe);

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-reset-otp", verifyResetOtp);
authRouter.post("/reset-password", resetPassword);

authRouter.patch("/profile", protect, upload.single("image"), updateProfile);

authRouter.patch("/password", protect, changePassword);
authRouter.delete("/account", protect, deleteAccount);

export default authRouter;
