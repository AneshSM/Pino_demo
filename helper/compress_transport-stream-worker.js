import { parentPort, workerData } from "worker_threads";
import { createStream } from "rotating-file-stream";

const { size, interval, compress, folder, file, limit } = workerData;

const stream = createStream(file, {
  size: size || "1000B",
  interval: interval || "10m",
  compress: compress || "gzip",
  path: folder,
  maxFiles: limit,
});

const logBuffer = [];
const FLUSH_INTERVAL = 100; // Flush logs every 100ms
let flushing = false;

const flushLogs = () => {
  if (flushing || logBuffer.length === 0) return;
  flushing = true;

  const logs = logBuffer.splice(0, logBuffer.length).join("");
  stream.write(logs, () => {
    flushing = false;
  });
};

parentPort.on("message", (log) => {
  logBuffer.push(log);
  if (!flushing) {
    setTimeout(flushLogs, FLUSH_INTERVAL);
  }
});

// Ensure logs are flushed on worker exit
process.on("exit", flushLogs);
