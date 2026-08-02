import express from "express";
import connectToDB from "./config/connectToDB.js";
import routes from "./app.js";
import cors from "cors";
import logger from "./middleware/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

// MIDDLEWARES
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /https:\/\/.*\.vercel\.app$/i.test(origin) ||
        /http:\/\/localhost:\d+$/i.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB CONNECTION
connectToDB();

// ROUTE HANDLING
app.get("/", (req, res) => {
  res.json({
    message: "Polling API is running",
    docs: "/api",
  });
});

// Route handling for API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Polling API is running",
    docs: "/api",
  });
});
app.use("/api/", routes);

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `No route found at ${req.originalUrl}` });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
