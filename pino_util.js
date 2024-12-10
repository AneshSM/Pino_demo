import pino from "pino";
import Loggers from "./loggers.json" assert { type: "json" };

/**
 * Validates the meta data passed to the logger wrapper before passing to pino
 * methods and ensures it has the required fields.
 *
 * @param loggerKey - logger key of pino_loggers.json object
 * @param method - avaialbe logger methods
 * @param schema - logger schema as pino_loggers.json structure
 * @param obj - logger key defined in pino_loggers.json
 * @throws {Error} - If the configuration is invalid.
 */
const validateFields = (loggerKey, method, schema, obj) => {
  const requiredFields = schema[loggerKey]?.["required"]?.[method] || [];
  if ((typeof obj !== "object" || !obj) && requiredFields.length > 0) {
    throw new Error(
      `Missing required fields for ${loggerKey}.${method}: ${requiredFields.join(
        ", "
      )}`
    );
  } else {
    const missingFields = requiredFields.filter((field) => !(field in obj));

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
 * Wraps a pino logger method with validation logic.
 * Which will validate the data before passing it to the pino logger function
 *
 * @param originalFn - The original logger method (info/warn/error).
 * @param loggerKey - The logger name (e.g., "validationLogger").
 * @param method - The method being wrapped (info/warn/error).
 * @returns {Function} - The wrapped logger method.
 */
const wrapLoggerMethod = (originalFn, loggerKey, method) => {
  return (obj, msg, ...args) => {
    validateFields(loggerKey, method, Loggers, obj);
    return originalFn(obj, msg, ...args);
  };
};

/**
 * Dynamically wraps logger methods with validation logic.
 *
 * @param logger - The original logger instance.
 * @param loggerKey - The logger name (e.g., "validationLogger").
 * @returns {pino.Logger} - The wrapped logger instance.
 */
const wrapLogger = (logger, loggerKey) => {
  const wrappedLogger = logger.child({}); // Clone the logger instance for better isolation and thread safety

  ["info", "warn", "error", "debug", "fatal", "trace"].forEach((method) => {
    wrappedLogger[method] = wrapLoggerMethod(
      logger[method].bind(logger),
      loggerKey,
      method
    );
  });

  return wrappedLogger;
};

/**
 * Validates the `loggers.json` configuration and ensures it has the correct structure.
 *
 * @param config - The parsed loggers.json configuration.
 * @returns {Object} - The validated logger configuration.
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
      throw new Error(`Invalid logger configuration: ${key} -> ${value}`);
    }
  });

  return config;
};

/**
 * Generates a date-based file path for logging.
 *
 * @param {string} parent - The parent folder (e.g., "Validation", "System").
 * @param {string} context - The context used for the file name prefix (e.g., "error", "info").
 * @returns {string} - The dynamically generated log file path.
 */
const generateLogFilePath = (parent, context) => {
  try {
    const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    return `./logs/${parent}/${context}-${date}.log`;
  } catch (error) {
    console.error("Error generating log file path:", error);
    throw new Error("Failed to generate log file path.");
  }
};

/**
 * Creates transport configurations for different log levels.
 *
 * @param {string} loggerCategory - The logger field name (e.g., "Validation").
 * @returns {Array} - Array of transport targets for pino.
 */
const createTransportConfig = (loggerCategory) => {
  try {
    return [
      {
        target: "pino-pretty",
        options: {
          colorize: true, // Enable colored output
          translateTime: "SYS:standard", // Formats time as `YYYY-MM-DD HH:mm:ss`
        },
      },
      {
        target: "pino/file",
        level: "error",
        options: {
          destination: generateLogFilePath(loggerCategory, "error"),
          mkdir: true, // Automatically create missing directories
        },
      },
      {
        target: "pino/file",
        level: "warn",
        options: {
          destination: generateLogFilePath(loggerCategory, "warn"),
          mkdir: true,
        },
      },
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: generateLogFilePath(loggerCategory, "info"),
          mkdir: true,
        },
      },
    ];
  } catch (error) {
    console.error("Error creating transport configuration:", error);
    throw new Error("Failed to create transport configuration.");
  }
};

/**
 * Initializes a pino logger instance for a given context.
 *
 * @param {string} loggerKey - The logger key (e.g., "validation").
 * @param {string} loggerCategory - The logger display name (e.g., "Validation").
 * @returns {pino.Logger} - Configured pino logger instance.
 */
const createLogger = (loggerKey, loggerCategory) => {
  try {
    const options = {
      level: "debug", // Logs messages up to the "debug" level
      customLevels: {}, // Add custom levels here if needed
      timestamp: () => `,"time":"${new Date().toLocaleString()}"`,
      // Inject a "type" field based on the log level
      mixin(_context, level) {
        return { type: pino.levels.labels[level]?.toUpperCase() };
      },

      // Merge strategy to ensure flat logging structure
      mixinMergeStrategy(mergeObject, mixinObject) {
        return { ...mergeObject, ...mixinObject };
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
      if (!loggerKey || !loggerConfig || !loggerConfig.category) {
        console.warn(
          `Skipping invalid logger configuration: ${loggerKey} -> ${loggerConfig}`
        );
        return acc; // Skip invalid logger configuration
      }
      const { category } = loggerConfig;
      const logger = createLogger(loggerKey, category);
      acc[loggerKey] = wrapLogger(logger, loggerKey);
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

export default loggers;
