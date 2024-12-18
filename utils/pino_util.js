import pino from "pino";
import Loggers from "../config/loggers.json" assert { type: "json" };

/**
 * Enum-like object for Log Categories
 */

const logsCategory = {
  SYSTEM: "system",
  AUTHENTICATION: "authentication",
  VALIDATION: "validation",
  USAGE: "usage",
};

/**
 * Validates metadata passed to the logger wrapper before logging.
 * Ensures the metadata contains required fields as per the schema.
 *
 * @param {string} loggerKey - The logger key (e.g., "validationLogger").
 * @param {string} method - The log method being used (e.g., "info", "warn", "error").
 * @param {Object} schema - The logger schema from the configuration.
 * @param {Object} metadata - Metadata object to validate.
 * @throws {Error} - If required fields are missing.
 */
const validateMetadata = (loggerKey, method, schema, metadata) => {
  const requiredFields = schema[loggerKey]?.["required"]?.[method] || [];
  if (!metadata || typeof metadata !== "object") {
    if (requiredFields.length > 0) {
      throw new Error(
        `Missing required metadata for ${loggerKey}.${method}. Required fields: ${requiredFields.join(
          ", "
        )}`
      );
    }
  } else {
    const missingFields = requiredFields.filter(
      (field) => !(field in metadata)
    );
    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields for ${loggerKey}.${method}: ${missingFields.join(
          ", "
        )}`
      );
    }
  }
};

/**
 * Wraps a Pino logger method with validation logic.
 * Validates metadata against schema before calling the original logger method.
 *
 * @param {Function} originalMethod - The original logger method (info, warn, error, etc.).
 * @param {string} loggerKey - The logger key (e.g., "validationLogger").
 * @param {string} method - The log method being wrapped (e.g., "info", "warn").
 * @returns {Function} - The wrapped logger method.
 */
const wrapLoggerMethod = (originalMethod, loggerKey, method) => {
  return (metadata, msg, ...args) => {
    validateMetadata(loggerKey, method, Loggers, metadata); // Validate metadata
    return originalMethod(metadata, msg, ...args); // Call the original method
  };
};

/**
 * Wraps all methods of a logger instance with validation logic.
 *
 * @param {pino.Logger} logger - The original Pino logger instance.
 * @param {string} loggerKey - The logger key (e.g., "validationLogger").
 * @returns {pino.Logger} - The wrapped logger instance.
 */
const wrapLogger = (logger, loggerKey) => {
  const wrappedLogger = logger.child({}); // Clone the logger instance for isolation
  const methods = ["info", "warn", "error", "debug", "fatal", "trace"];

  methods.forEach((method) => {
    wrappedLogger[method] = wrapLoggerMethod(
      logger[method].bind(logger),
      loggerKey,
      method
    );
  });

  return wrappedLogger;
};

/**
 * Validates the logger configuration schema.
 *
 * @param {Object} config - The logger configuration object.
 * @returns {Object} - The validated configuration.
 * @throws {Error} - If the configuration is invalid.
 */
const validateLoggerConfig = (config) => {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Invalid or missing `loggers.json` configuration.");
  }
  // Ensure all keys and values are valid
  Object.entries(config).forEach(([key, value]) => {
    if (
      typeof key !== "string" ||
      typeof value !== "object" ||
      !value.category
    ) {
      throw new Error(`Invalid logger configuration for "${key}".`);
    }
  });

  return config;
};

/**
 * Generates transport configurations for logging to files and console,
 * Generated files are date based.
 * @param {string} category - The logger category (e.g., "Validation").
 * @returns {Array} - Array of transport targets for Pino.
 */
const createTransportConfig = (category) => {
  const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return [
    {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard", // Formats time as `YYYY-MM-DD HH:mm:ss`
      },
    },
    {
      target: "pino/file",
      level: "error",
      options: {
        destination: `./logs/${category}/errors/error-${date}.log`,
        mkdir: true,
      },
    },
    {
      target: "pino/file",
      level: "warn",
      options: {
        destination: `./logs/${category}/warnings/warn-${date}.log`,
        mkdir: true,
      },
    },
    {
      target: "pino/file",
      level: "info",
      options: {
        destination: `./logs/${category}/info/info-${date}.log`,
        mkdir: true,
      },
    },
  ];
};

/**
 * Creates a Pino logger instance for a given logger key and category.
 *
 * @param {string} loggerKey - The logger key (e.g., "validationLogger").
 * @param {string} category - The logger category (e.g., "Validation").
 * @param {string[]} redactFields - Fields to redact in the logs.
 * @returns {pino.Logger} - The created Pino logger instance.
 */
const createLogger = (loggerKey, loggerCategory, redactFields = []) => {
  try {
    const options = {
      level: "debug", // Logs messages up to the "debug" level
      customLevels: {}, // Add custom levels here if needed
      timestamp: () => `,"time":"${new Date().toLocaleString()}"`, //local machine date
      errorKey: "error", // The string key for the 'error' in the JSON object.

      // Inject a "type" field based on the log level
      mixin(_context, level) {
        return { type: pino.levels.labels[level]?.toUpperCase() };
      },
      // Merge strategy to ensure flat logging structure
      mixinMergeStrategy(mergeObject, mixinObject) {
        return { ...mergeObject, ...mixinObject };
      },

      // Redact sensitive fields
      redact: {
        paths: redactFields,
        censor: "[Redacted]", // Replace sensitive fields with this value
      },

      // Transport configurations
      transport: {
        targets: createTransportConfig(loggerCategory),
      },
    };
    return pino(options);
  } catch (error) {
    console.error(`Error creating logger for key "${loggerKey}":`, error);
    throw new Error(`Failed to create logger for "${loggerKey}".`);
  }
};

/**
 * Dynamically generates loggers based on the `loggers.json` configuration.
 *
 * @returns {{[key: string]: pino.Logger}} - Object containing logger instances.
 */
const generateLoggers = () => {
  try {
    const config = validateLoggerConfig(Loggers);

    return Object.entries(config).reduce((acc, [loggerKey, loggerConfig]) => {
      if (!loggerKey || !loggerConfig || !loggerConfig?.category) {
        console.warn(
          `Skipping invalid logger configuration: ${loggerKey} -> ${loggerConfig}`
        );
        return acc; // Skip invalid logger configuration
      } else {
        const { category, redactFields = [] } = loggerConfig;
        const logger = createLogger(loggerKey, category, redactFields);
        acc[loggerKey] = wrapLogger(logger, loggerKey);
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error generating loggers:", error);
    throw new Error("Failed to generate loggers.");
  }
};

/**
 * Initializes and exports the loggers.
 * Provides a centralized logging utility for different application contexts.
 */
let loggers = {};

try {
  if (!Object.keys(Loggers).length)
    console.log(
      "Loggers are not initiated as there is no loggers configuration in logger.json"
    );
  loggers = generateLoggers();
} catch (error) {
  // console.error(
  //   "Failed to initialize loggers. Falling back to default console logger."
  // );
  // const fallbackLogger = pino({ level: "info" });
  // loggers = { default: fallbackLogger };

  console.error("Failed to initialize loggers:", error);
  process.exit(1); // Terminate the process if loggers fail to initialize
}

export { loggers, logsCategory };
