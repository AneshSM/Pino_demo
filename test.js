import path from "path";
import pino from "pino";

const transport = pino.transport({
  timestamp: pino.stdTimeFunctions.isoTime,
  targets: [
    {
      target: "pino-roll",
      options: {
        file: "./logs/tests/logs",
        mkdir: true,
        size: "5b",
        frequency: "daily",
        extension: "log",
        dateFormat: "yyyy-MM-dd",
        limit: { count: 5 },
      },
    },
  ],
});

const logger = pino(transport);

// rotating file stream

// const logger = pino({
//   name: "testing123",
//   level: "trace",
//   transport: {
//     targets: [
//       {
//         target: path.resolve("transport-stream.js"),
//         level: "trace",
//         options: {
//           mkdir: true, // Ensure the directory is created if missing
//           append: true,
//           folder: path.resolve("logs", "tests"),
//           file: "delete-me.log",
//           interval: "5s",
//           compress: "gzip",
//         },
//       },
//     ],
//   },
// });

logger.info("started");

let counter = 1;
setInterval(() => {
  logger.info(`interval #${counter++}`);
}, 1000);
