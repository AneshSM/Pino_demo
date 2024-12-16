import { AxiosError } from "axios";
import { FS_Error, GitError } from "../utils/error_util.js";
import loggers from "../utils/pino_util.js";

/**
 * Error logging middleware
 * Logs errors if they meet specified criteria.
 */
const errorLogger = (err, req, res, next) => {
  try {
    if (err?.logger) {
      // Define loggable error criteria/variants
      let { category, message, variant, ...loggerData } = err.logger;
      // req.path
      let loggerMethod;
      const isWarning = err.statusCode === 400;

      message = message || err.message;
      loggerData["error"] = JSON.parse(JSON.stringify(err?.error));

      if (category === "system") {
        loggerMethod = isWarning
          ? loggers?.systemLogger?.warn
          : loggers?.systemLogger?.error;
        loggerMethod(loggerData, message);
      } else if (category === "authentication") {
        loggerMethod = isWarning
          ? loggers?.authLogger?.warn
          : loggers?.authLogger?.error;
        loggerMethod(loggerData, message);
      } else if (category === "validation") {
        loggerMethod = isWarning
          ? loggers?.validationLogger?.warn
          : loggers?.validationLogger?.error;
        loggerMethod(loggerData, message);
      } else if (category === "usage") {
        loggerMethod = isWarning
          ? loggers?.usageLogger?.warn
          : loggers?.usageLogger?.error;
        loggerMethod(loggerData, message);
      }
    }

    // Pass error to the next middleware for error handling
    err.logger = null;
    next(err);
  } catch (loggingError) {
    console.error("Error logging failed:", loggingError);
  }
};

/**
 * Error handler middleware
 * Error response are consoled with context and responded with their status code
 */
// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.log("-------- Error Handler Middleware --------");
  console.log(err); // console log the error object for debugging

  // Handle Axios Errors
  if (err instanceof AxiosError) {
    console.log("-------- Axios Error --------");

    if (err.response) {
      // Server responded with an error status code
      console.error("Response Error:", {
        data: err.response.data,
        status: err.response.status,
        headers: err.response.headers,
      });
    } else if (err.request) {
      // Request was made but no response was received
      console.error("Request Error:", err.request);
    } else {
      // Error occurred during request setup
      console.error("Axios Configuration Error:", {
        message: err.message,
        config: err.config,
      });
    }
  }

  // Handle File System Errors (if applicable)
  if (err instanceof FS_Error) {
    console.log("-------- File System Error --------");
    console.error("Path:", err.path);
  }

  // Handle Git Errors (if applicable)
  if (err instanceof GitError) {
    console.log("-------- Git Error --------");
    console.error({
      log: err.log,
      path: err.path,
      command: err.command,
    });

    // Set a custom status code for Git errors
    err.statusCode = 500;
  }

  // Handle Specific Error Codes
  if (err.code === "EBUSY") {
    console.log("-------- Resource Busy Error --------");
    err.statusCode = 500;
    err.message = "Repository folder is busy or locked";
  }

  // Set Default Status and Message
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred";
  const errorData = err.data || undefined;

  // Send Error Response
  res.status(statusCode).json({
    error: true,
    success: false,
    status: statusCode,
    message,
    data: errorData,
    stack: err.stack,
  });
};

export { errorHandler, errorLogger };
