const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  // Log when request arrives
  console.log(`\n[${timestamp}] 🚀 ${req.method} ${req.originalUrl}`);

  // Capture response finish to log status code and response time
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Pick an icon based on status code
    const statusIcon = status >= 400 ? "❌" : "✅";

    console.log(
      `[${new Date().toLocaleTimeString()}] ${statusIcon} ${req.method} ${req.originalUrl} - ${status} (${duration}ms)`,
    );
  });

  next(); // Pass control to next middleware / route
};

export default logger;
