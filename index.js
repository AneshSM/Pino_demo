import express from "express";
import systemLogger from "./utils.js";

const app = express();
const port = 3000;

// Routes
app.get("/", (req, res) => {
  systemLogger.info("GET / request received"); // Use request logger
  res.send("Hello, Pino Logger!");
});

app.get("/error", (req, res) => {
  systemLogger.error("Simulated error occurred"); // Simulate an error log
  res.status(500).send("Something went wrong!");
});

// Structured logging example
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  systemLogger.user({ userId }, "Fetching user data");
  res.send(`User data for user ${userId}`);
});

// Log using child logger
const serviceLogger = systemLogger.child({ module: "user-service" });

app.get("/child-log", (req, res) => {
  serviceLogger.info("Child logger example");
  res.send("Logged with child logger");
});

app.get("/file-log", (req, res) => {
  systemLogger.info("This log is handled by a worker thread");
  res.send("Log written to file using worker thread");
});

// Error handling
app.use((err, req, res, next) => {
  systemLogger.error({ err }, "Unhandled exception");
  res.status(500).send("Internal Server Error");
});

// Unhandled exceptions and rejections
process.on("uncaughtException", (err) => {
  systemLogger.fatal({ err }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  systemLogger.error({ reason }, "Unhandled Rejection");
});

// Start the server
app.listen(port, () => {
  systemLogger.debug("Server started");
  systemLogger.info(`Server is running on http://localhost:${port}`);
});
