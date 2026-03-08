import { parentPort } from "worker_threads";

parentPort.on("message", (data) => {
  const sortedData = [...data].sort((a, b) => a - b);
  parentPort.postMessage(sortedData);
});
