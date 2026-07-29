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
export const resendOtp = async (req, res) => {
  try {
    const user = await User.findone({email: req.body.email});
    if(!user){
      return res.status(404).json({
        message: "User not found"
      })
    }

    user.otp = generateOtp();
    user.otpExpiry = otpExpiry();


    await user.save();
    await sendOtpEmail(user.email, user.otp, "Verify your Polify Account!");
    res.json({
      message: "OTP Sent"
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

// Login User
const login = async (req, res)=>{
  try {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first", needsVerification: true, email
      })
    }

    res.json({
      token: generateToken(user._id), 
      user: clean(user)
    })

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

// To Update your profile
export const updateProfile = async (req, res) => {
  try {
    const { name, username, bio } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const taken = await User.findOne({ username });
      if (taken) return res.status(400).json({ message: "Username already taken" });
      user.username = username;
    }
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (req.file) {
      try { user.avatar = await uploadToCloudinary(req.file.buffer); }
      catch (e) { console.warn("Avatar upload skipped:", e.message); }
    }
    await user.save();
    res.json({ user: clean(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// To change your password
export const changepassword = async (req, res )=>{
  try {
    const {userId, currentPassword, newPassword} = req.body;
    if (!newPassword || newPassword < 6) {
      return res.status(400).json({
        message: "Password must be atleast 6 characters"
      })
    }

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    if(!(await comparePassword(currentPassword))){
      return res.status(400).json({
        message: "Current Password is incorrect"
      })
    }

    user.password = newPassword;
    await user.save();
    res.json({
      message: "Password updated"
    })

  } catch (error) {
      return res.status(500).json({
        message: error.message
      })
  }
}

// to delete an account
export const deleteAccount = async (req, res) => {
  try {
    const id = req.userId
    const myPolls = await Poll.find({creator: id}).select("_id")
    const pollIds = myPolls.map((poll)=>poll._id)
    
    await Comment.deleteMany({ $or: [{user: id}, {poll: { $in: pollIds }}] })
    await Poll.deleteMany({ creator: id });
    await Poll.updateMany( {}, { $pull: { votes: { user: id } } } ); 
    await User.findByIdAndDelete(id);

    res.json({ message: "Account Deleted" })
  } catch (err) {
    return res.status(500).json({ message: err.message})
  }
}

// To get logged in user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const [created, voted] = await Promise.all([
      Poll.countDocuments({ creator: user._id }),
      Poll.countDocuments({ "votes.user": user._id })
    ]);

    res.json({
      user: clean(user),
      stats: {
        created,
        voted,
        bookmarked: user.bookmarks.length
      }
    })

  }
  catch(err){
    return res.status(500).json({ message: err.message})
  }
}