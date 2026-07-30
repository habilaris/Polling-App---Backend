import express from "express";
import User from "./models/User.js";
import authRouter from "./routes/authRoutes.js";

const router = express.Router();

// MIDDLEWARE
router.use(express.json()); // for parsing "Content-Type:" application/json

// ROUTES
router.get("/", (req, res) => {
  res.send("Hello from the backend API!");
});

router.use("/auth", authRouter);

export default router;
