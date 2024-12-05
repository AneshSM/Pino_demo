import pino from "pino";
import path from "path";

// Helper function to create dynamic date-based file paths
const getLogFilePath = (type) => {
  const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return `./logs/${type}/${type}-${date}.log`;
};

export default pino({
  customLevels: { user: 35 },
  useOnlyCustomLevels: false,
  timestamp: pino.stdTimeFunctions.isoTime,
  level: "debug",
  transport: {
    targets: [
      {
        target: "pino-pretty", // Use pretty logging in development
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
      {
        target: "pino/file",
        level: "user",
        options: {
          destination: getLogFilePath("users"),
          mkdir: true, // Ensure the directory is created if missing
        },
      },
      {
        target: "pino/file",
        level: "error",
        options: {
          destination: getLogFilePath("errors"),
          mkdir: true, // Ensure the directory is created if missing
        },
      },
      {
        target: "pino/file",
        options: {
          destination: getLogFilePath("system"),
          mkdir: true, // Ensure the directory is created if missing
        },
      },
      {
        target: path.resolve("transport-stream.js"),
        level: "info",
        options: {
          folder: path.resolve("logs", "compressed"),
          file: "info.log",
          size: "1K",
          interval: "10s",
          compress: "gzip",
          limit: 5,
        },
      },
      {
        target: "pino-roll",
        level: "info",
        options: {
          file: "./logs/roateZip/latestLog",
          mkdir: true,
          size: "1k",
          frequency: "daily",
          extension: ".log",
          dateFormat: "yyyy-MM-dd",
          limit: { count: 5 },
        },
      },
    ],
  },
});
