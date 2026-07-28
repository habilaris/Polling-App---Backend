import express from "express";
// import dashRoutes from "./routes/dashRoutes"
import User from "./models/User.js";

const router = express.Router();

// MIDDLEWARE
router.use(express.json()); // for parsing "Content-Type:" application/json

// ROUTES
router.get("/", (req, res) => {
  res.send("Hello from the backend API!");
});

// Signup Route
router.post("/signup", async (req, res) => {
  // Handle signup logic here
  const { name, username, email, password } = req.body;
  // You can add validation and database logic here
  const user = await User.create({ name, username, email, password });
  console.log("User created:", user);
  res.status(201).json(user);
});

export default router;
