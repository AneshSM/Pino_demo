import { loggers, logsCategory } from "../utils/pino_util.js";

/**
 * Helper function to get the appropriate logger method based on category
 * @param {string} category
 * @param {boolean} isWarning
 * @returns {Function}
 */
const getResponseLoggerInfoMethod = (category) => {
  const logCategory = {
    [logsCategory.SYSTEM]: loggers.systemLogger,
    [logsCategory.AUTHENTICATION]: loggers.authLogger,
    [logsCategory.VALIDATION]: loggers.validationLogger,
    [logsCategory.USAGE]: loggers.usageLogger,
  };

  const logger = logCategory[category];
  return logger?.info;
};

/**
 * Response Logger Middleware
 * Logs response details if logger property exists in the response object
 */
const responseLogger = (req, res, next) => {
  // Intercept the response once it's finished
  const originalSend = res.send;

  res.send = function (body) {
    if (res?.logger) {
      const { logger } = res;
      const { category, message: loggerMessage, ...loggerData } = logger;

      const message =
        loggerMessage || `Response logged for status: ${res.statusCode}`;

      const logMethod = getResponseLoggerInfoMethod(category);
      if (logMethod) {
        logMethod(loggerData, message);
      }

      // Clear logger to prevent re-logging
      res.logger = null;
    }

    // Proceed with the original `res.send` call
    return originalSend.call(this, body);
  };

  next();
};

export default responseLogger;
