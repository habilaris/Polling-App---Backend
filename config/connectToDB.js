import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const connectToDB = async () => {
  if (mongoose.connections[0]?.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectToDB;
