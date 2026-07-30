import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  changepassword,
  deleteAccount,
  getMe,
  register,
  resendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/authController.js";
import {
  forgotPassword,
  resetOtp,
  resetPassword,
  verifyResetOtp,
} from "../controllers/passwordController.js";

import { protect } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("register", upload.single("image"), register);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);

authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-reset-otp", verifyResetOtp);

authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", protect, getMe);
authRouter.patch("profile", protect, upload.single("image"), updateProfile);

authRouter.patch("/password", protect, changepassword);
authRouter.delete("/account", protect, deleteAccount);

export default authRouter;
