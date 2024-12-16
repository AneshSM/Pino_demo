import { createStream } from "rotating-file-stream";
import { Worker } from "worker_threads";

const CUSTOM_TRANSPORT_WORKER = true;

export default function transportStream(options) {
  if (!CUSTOM_TRANSPORT_WORKER) {
    const { size, interval, compress, folder, file, limit } = options;
    return createStream(file, {
      size: size || "1000B",
      interval: interval || "10m",
      compress: compress || "gzip",
      path: folder,
      maxFiles: limit,
    });
  }
  const worker = new Worker(
    new URL("./compress_transport-stream-worker.js", import.meta.url),
    {
      workerData: options,
    }
  );

  // Handle worker errors
  worker.on("error", (err) => {
    console.error("Worker encountered an error:", err);
  });

  // Gracefully handle worker exits
  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });

  // Return a write interface for Pino
  return {
    write: (log) => {
      worker.postMessage(log);
    },
  };
}
