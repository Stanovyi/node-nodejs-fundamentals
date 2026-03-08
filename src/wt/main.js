import { readFile } from "fs/promises";
import { Worker } from "worker_threads";
import { cpus } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const directoryName = dirname(fileURLToPath(import.meta.url));

const main = async () => {
  const raw = await readFile(join(directoryName, "data.json"), "utf-8");
  const numbers = JSON.parse(raw);
  const coreCount = cpus().length;

  const chunkSize = Math.ceil(numbers.length / coreCount);
  const chunks = [];
  for (let i = 0; i < coreCount; i++) {
    chunks.push(numbers.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  const sortedChunks = await Promise.all(
    chunks.map(
      (chunk, i) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(join(directoryName, "worker.js"));

          worker.postMessage(chunk);

          worker.on("message", resolve);
          worker.on("error", reject);
        }),
    ),
  );

  const result = [];

  const pointers = new Array(sortedChunks.length).fill(0);

  while (true) {
    let minVal = Infinity;
    let minIdx = -1;

    for (let i = 0; i < sortedChunks.length; i++) {
      if (pointers[i] < sortedChunks[i].length) {
        if (sortedChunks[i][pointers[i]] < minVal) {
          minVal = sortedChunks[i][pointers[i]];
          minIdx = i;
        }
      }
    }

    if (minIdx === -1) {
      break;
    }

    result.push(minVal);
    pointers[minIdx]++;
  }

  console.log(result);
};

await main();
