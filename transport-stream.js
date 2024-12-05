import { createStream } from "rotating-file-stream";
import path from "path";

export default function (options) {
  const { size, interval, compress, folder, file, limit } = options;
  return createStream(file, {
    size: size || "1000B",
    interval: interval || "10m",
    compress: compress || "gzip",
    path: folder,
    maxFiles: limit,
  });
}
