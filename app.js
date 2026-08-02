import express from "express";
import User from "./models/User.js";
import authRouter from "./routes/authRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import pollRouter from "./routes/pollRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import userRouter from "./routes/userRoutes.js";

const router = express.Router();

// MIDDLEWARE
router.use(express.json()); // for parsing "Content-Type:" application/json

// ROUTES
router.get("/", (req, res) => {
  res.send("Hello from the backend API!");
});

router.use("/auth", authRouter);
router.use("/polls", pollRouter);
router.use("/comments", commentRouter);
router.use("/users", userRouter);
router.use("/notifications", notificationRouter);

export default router;
