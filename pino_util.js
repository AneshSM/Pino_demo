import pino from "pino";
import Loggers from "./loggers.json" assert { type: "json" };

/**
 * Generates a date-based file path for logging.
 *
 * @param {string} parent - The parent folder (e.g., 'validation', 'system').
 * @param {string} context - The context used for the file name prefix (e.g., 'error', 'info').
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
 * Creates transport configurations for different log categories.
 *
 * @param {string} loggerField - The logger field name (e.g., 'validation').
 * @returns {Array} - Array of transport targets for pino.
 */
const createTransportConfig = (loggerField) => {
  try {
    return [
      // Pretty logs for development
      {
        target: "pino-pretty",
        options: {
          colorize: true, // Enable colored output
          translateTime: "SYS:standard", // Formats time as `YYYY-MM-DD HH:mm:ss`
        },
      },
      // Error logs to file
      {
        target: "pino/file",
        level: "error",
        options: {
          destination: generateLogFilePath(loggerField, "error"),
          mkdir: true, // Automatically create missing directories
        },
      },
      // Warn logs to file
      {
        target: "pino/file",
        level: "warn",
        options: {
          destination: generateLogFilePath(loggerField, "warn"),
          mkdir: true,
        },
      },
      // Info logs to file
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: generateLogFilePath(loggerField, "info"),
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
 * @param {string} loggerKey - The logger key (e.g., 'validationLogger', 'systemLogger').
 * @param {string} loggerField - The logger display name (e.g., 'Validation', 'System').
 * @returns {pino.Logger} - Configured pino logger instance.
 */
const createLogger = (loggerKey, loggerField) => {
  try {
    return pino({
      level: "debug", // Logs messages up to the "debug" level
      customLevels: {}, // Add custom levels here if needed
      timestamp: pino.stdTimeFunctions.isoTime, // Use ISO time format for timestamps

      // Inject a "context" field based on the log level
      mixin(_context, level) {
        return { context: pino.levels.labels[level].toUpperCase() };
      },

      // Merge strategy to ensure flat logging structure
      mixinMergeStrategy(mergeObject, mixinObject) {
        return { ...mergeObject, ...mixinObject };
      },

      // Transport configurations (console and file)
      transport: {
        targets: createTransportConfig(loggerField),
      },
    });
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
    if (!Loggers || typeof Loggers !== "object") {
      throw new Error("Invalid or missing `loggers.json` configuration.");
    }

    return Object.entries(Loggers).reduce((acc, [loggerKey, loggerField]) => {
      if (!loggerKey || !loggerField) {
        console.warn(
          `Skipping invalid logger configuration: ${loggerKey} -> ${loggerField}`
        );
        return acc; // Skip invalid logger configuration
      }

      acc[loggerKey] = createLogger(loggerKey, loggerField);
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
