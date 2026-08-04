import mongoose from "mongoose";

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.DB_URL);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectToDB;
