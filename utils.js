import pino from "pino";

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
    ],
  },
});
