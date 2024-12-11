import express from "express";
import Loggers from "./pino_util.js";

const app = express();
const port = 3000;
// Routes
app.get("/", (req, res) => {
  Loggers.systemLogger.info(
    { code: "ROOT_API", context: "root api call" },
    "GET / request received"
  ); // Use request logger
  res.send("Hello, Pino Loggers!");
});

app.get("/validation", (req, res) => {
  Loggers.validationLogger.info(
    {
      code: "VALIDATION_KEY_SUCCESS",
      context: "Successull license key validation",
    },
    "The license key validated successfully"
  );
  res.send("Validation endpoint");
});

app.get("/authentication", (req, res) => {
  Loggers.authLogger.error(
    {
      code: "AUTH_LICENSE_NOT_FOUND",
      context: "license key not found",
    },
    "No matching license was found for the provided key."
  );
  res.send("Authentication endpoint");
});

app.get("/system", (req, res) => {
  Loggers.systemLogger.warn(
    {
      code: "SYSTEM_INVALID_CLOCK",
      context: "Invalid System Clock",
    },
    "The system clock is inaccurate. Check your system time."
  );
  res.send("System endpoint");
});

app.get("/usage", (req, res) => {
  Loggers.usageLogger.info(
    {
      code: "USAGE_RECORDED",
      context: "License Usage Recorded",
    },
    "Usage recorded successfully for license key."
  );
  res.send("Usage endpoint");
});

app.get("/error", (req, res) => {
  Loggers.systemLogger.error(
    { code: "SIMULATED_ERROR", context: "simulated error" },
    "Simulated error occurred"
  ); // Simulate an error log
  res.status(500).send("Something went wrong!");
});

// Structured logging example
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  Loggers.usageLogger.info(
    { code: "USER_DATA_ACCESS", context: "user data api call", userId },
    "Fetching user data"
  );
  res.send(`User data for user ${userId}`);
});

// Log using child logger
const serviceLogger = Loggers.usageLogger.child({ module: "user-service" });

app.get("/child-log", (req, res) => {
  serviceLogger.info(
    { code: "CHILD_LOGGER", context: "system child logger" },
    "Child logger example"
  );
  res.send("Logged with child logger");
});

// Error handling
app.use((error, req, res, next) => {
  Loggers.systemLogger.error(
    { code: "SERVER_ERROR", context: "server error", error },
    "Unhandled exception"
  );
  res.status(500).send("Internal Server Error");
});

// Unhandled exceptions and rejections
process.on("uncaughtException", (error) => {
  Loggers.systemLogger.fatal(
    { code: "UNCAUGHT_EXCEPTION", context: "uncaught exception", error },
    "Uncaught Exception"
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  Loggers.systemLogger.error(
    { code: "UNHANDLED_REJECTION", context: "unhandled rejection", reason },
    "Unhandled Rejection"
  );
});

// Start the server
app.listen(port, () => {
  Loggers.systemLogger.debug("Server started");
  Loggers.systemLogger.info(
    { code: "INITIATE_SERVER", context: "server started" },
    `Server is running on http://localhost:${port}`
  );
});
