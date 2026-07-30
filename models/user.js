import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    /**
     * TODO: Only getting name is not much efficient, we should get first name and last name separately. But I can take that separately in a specific api endpoint. For now, I will keep it simple and just get the name as a single string.
     */
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: [true, "Username already exists"],
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: { type: String, default: "" },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio must be at most 160 characters long"],
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poll" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre("save", async () => {
  // In this situation we are only hashing the passwords that are not hashed (e.g., In cases of new user creation or password changing afterwards ), we do this so we dont hash the password more than once.

  // if password is not modified, we don't need to hash it again, so we can just call next() and move on.
  if (!this.isModified("password")) {
    return;
  }
  // otherwise, we will hash the password and then call next() to move on.
  else {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  }
});

// Think of userSchema.methods as an empty toolbox that Mongoose gives every schema.
// You can just make tools and put items in that toolbox to use later on.
// Remember, it is not currently being used anywhere, but we can use it later on.
// The reason we are keeping this method in userSchema file instead of authController file is because we want to keep our code organized and maintainabl, and also because it is technically a child/method of userSchema. We can use this method in authController file later on when we need to compare the password.
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
