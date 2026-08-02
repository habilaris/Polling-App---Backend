import express from "express";
import mongoose from "mongoose";
import connectToDB from "./config/connectToDB.js";
import routes from "./app.js";
import dotenv from "dotenv";
import cors from "cors";
import logger from "./middleware/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDlEWARES
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(logger);

// DB CONNECTION
connectToDB();

// ROUTE HANDILING
// Test Route
app.get("/", (req, res) => {
  res.send("Welcome to the root route of polling-app-backend!");
});

// Route handling for API routes
app.use("/api", routes);

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `No route found at ${req.originalUrl}` });
});

// START SERVER
app.listen(3000, () => {
  console.log("\nServer is running on port 3000");
});
