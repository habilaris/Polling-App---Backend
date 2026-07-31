import User from "../models/user.js";
import { generateOtp, otpExpiry, otpValid } from "../utils/otp.js";
import { sendOtpEmail } from "../config/mailer.js";

// If the user forgot the password send an OTP email
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "No User found with this email" });
    }

    user.otp = generateOtp();
    user.otpExpiry = otpExpiry();

    await user.save();
    await sendOtpEmail(user.email, user.otp, "Reset your Pollify Password!");
    return res.json({
      message: "OTP sent to your email",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// To check if the OTP is valid
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!otpValid(user, otp))
      return res.status(400).json({ message: "Invalid or expired OTP" });
    res.status(200).json({
      ok: true,
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// To reset the password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be atleast 6 characters",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!otpValid(user, otp)) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = password;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();
    res.json({
      message: "Password has been reset successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
