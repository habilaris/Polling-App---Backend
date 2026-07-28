import User from "../models/user.js";
import Poll from "../models/poll.js";
import Comment from "../models/comment.js";
import nodemailer from "nodemailer";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { generateOtp, otpExpiry, otpValid } from "../utils/otp.js";
import jwt from "jsonwebtoken";

// Generate Token Function
const generateToken = (id) => {
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const clean = (u) => ({
    _id = u.id,
    name = u.name,
    email = u.email,
    username = u.username,
    avatar = u.avatar,
    bio = u.bio,
})

// Register a new user and send a verification otp on the email of the user
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    let avatar = "";
    if (req.file) {
      // If a file is uploaded, we can use the file path as the avatar and upload it to cloudinary
      try {
        avatar = await uploadToCloudinary(req.file.buffer);
      } catch (error) {
        console.warn(
          "Avatar could not be uploaded hence skipped",
          error.message,
        );
      }
    }

    // Generate OTP
    const otp = generateOtp();
    await User.create({
      name,
      username,
      email,
      password,
      avatar,
      otp,
      otpExpiry: otpExpiry(),
    });

    // To send otp
    await sendOtpEmail(email, otp, "Verify your Pollify Account!");
    res.status(201).json({
      needsVerification: true,
      email,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = User.findOne({ email });
    if (!user)
      return res.status(404).json({
        message: "User not found",
      });

    if (!user.isVerified && !otpValid(user, otp))
      return res.status(400).json({
        message: "Invalid or Expired OTP",
      });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Now to generate token
    res.json({
        token: generateToken(user._id),
        user: clean(user)
    })
  } catch (err) {
    res.status(500).json({
        message: err.message
    })
  }
};

// To Resend OTP
// export const resendOtp = ()=>{

// }