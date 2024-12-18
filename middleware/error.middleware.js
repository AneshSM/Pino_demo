import { AxiosError } from "axios";
import {
  ApiError,
  CustomError,
  FS_Error,
  GitError,
} from "../utils/error_util.js";
import { loggers, logsCategory } from "../utils/pino_util.js";

/**
 * Helper function to get the appropriate logger method based on category and warning status
 * @param {string} category
 * @param {boolean} isWarning
 * @returns {Function}
 */
const getLoggerMethod = (category, isWarning) => {
  const logCategory = {
    [logsCategory.SYSTEM]: loggers.systemLogger,
    [logsCategory.AUTHENTICATION]: loggers.authLogger,
    [logsCategory.VALIDATION]: loggers.validationLogger,
    [logsCategory.USAGE]: loggers.usageLogger,
  };

  const logger = logCategory[category];
  return isWarning ? logger?.warn : logger?.error;
};

/**
 * Error Logger Middleware
 * Logs error details if logger property exists in the error object
 */
const errorLogger = (err, req, res, next) => {
  if (!err?.logger) {
    return next(err);
  }

  const { logger } = err;
  const { category, message: loggerMessage, ...loggerData } = logger;
  const isWarning = err.statusCode === 400;

  const message = loggerMessage || err.message;
  loggerData.error = JSON.parse(JSON.stringify(err.error || {}));

  const logMethod = getLoggerMethod(category, isWarning);
  if (logMethod) {
    logMethod(loggerData, message);
  }

  // Clear logger and pass to next middleware
  err.logger = null;
  next(err);
};

/**
 * Helper function to safely get statusCode from various error types
 * @param {Error} err
 * @returns {number}
 */
const getStatusCode = (err) => {
  if (err instanceof AxiosError) {
    return err.response?.status || 500;
  }
  return err.statusCode || 500;
};

/**
 * Helper function to handle Axios errors
 * @param {AxiosError} err
 */
const handleAxiosError = (err) => {
  console.error("-------- Axios Error --------");
  if (err.response) {
    console.error("Response Error:", {
      data: err.response.data,
      status: err.response.status,
      headers: err.response.headers,
    });
  } else if (err.request) {
    console.error("Request Error:", err.request);
  } else {
    console.error("Axios Configuration Error:", {
      message: err.message,
      config: err.config,
    });
  }
};

/**
 * Helper function to handle Git errors
 * @param {GitError} err
 */
const handleGitError = (err) => {
  console.error("-------- Git Error --------", {
    log: err.log,
    path: err.path,
    command: err.command,
  });
  err.statusCode = 500; // Assign custom status code for Git errors
};

/**
 * Helper function to handle file system errors
 * @param {CustomError} error
 * @returns {string}
 */
const handleFsError = (error) => {
  const errorMessages = {
    EACCES: "Permission denied.",
    ENOENT: "File or directory does not exist.",
    EBUSY: "Resource is busy or locked.",
    EEXIST: "File or directory already exists.",
    EPERM: "Operation not permitted.",
    ENOTDIR: "Expected a directory but found something else.",
  };

  return errorMessages[error.code] || `Unknown error: ${error.message}`;
};

/**
 * Helper function to handle Custom errors
 * @param {CustomError} err
 */
const handleCustomError = (err) => {
  console.error("-------- Custom Error --------");
  err.message = "Repository folder is busy or locked";
  handleFsError(err);
};

/**
 * Error Handler Middleware
 * Handles various error types and sends a structured response
 */
const errorHandler = (err, req, res, next) => {
  console.log("-------- Error Handler Middleware --------");
  console.error(err);

  // Handle specific error types
  if (err instanceof AxiosError) {
    handleAxiosError(err);
  } else if (err instanceof FS_Error) {
    console.error("-------- File System Error --------", { path: err.path });
  } else if (err instanceof GitError) {
    handleGitError(err);
  } else if (err instanceof CustomError) {
    handleCustomError(err);
  }

  // Set default status and message for error response
  const statusCode = getStatusCode(err);
  const message = err.message || "An unexpected error occurred";

  // Safely access `data` if it exists
  const data = "data" in err ? err.data : null;

  res.status(statusCode).json({
    error: true,
    message,
    data,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export { errorHandler, errorLogger };
