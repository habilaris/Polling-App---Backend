import "./config/loadEnv.js"; // must be first
import express from "express";
import connectToDB from "./config/connectToDB.js";
import routes from "./app.js";
import cors from "cors";
import logger from "./middleware/logger.js";

// dotenv.config() call removed from here — already loaded above

const app = express();
const PORT = process.env.PORT || 3000;
const configuredOrigins = [
  ...(process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
const allowedOrigins = [...new Set(configuredOrigins)];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /https:\/\/.*\.vercel\.app$/i.test(origin) ||
      /https:\/\/localhost(:\d+)?$/i.test(origin) ||
      /http:\/\/localhost(:\d+)?$/i.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// MIDDLEWARES
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
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

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "polling-api" });
});

// Route handling for API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Polling API is running",
    docs: "/api",
  });
});
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "polling-api" });
});
app.use("/api/", routes);

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `No route found at ${req.method} ${req.originalUrl}`,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
