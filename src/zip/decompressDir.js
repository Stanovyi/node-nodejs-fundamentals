import { createReadStream, createWriteStream } from "fs";
import { mkdir, access } from "fs/promises";
import { createBrotliDecompress } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const decompressDir = async () => {
  const compressedPath = join(__dirname, "workspace", "compressed");
  const archivePath = join(compressedPath, "archive.br");
  const decompressedPath = join(__dirname, "workspace", "decompressed");

  await access(compressedPath).catch(() => {
    throw new Error("FS operation failed");
  });
  await access(archivePath).catch(() => {
    throw new Error("FS operation failed");
  });

  await mkdir(decompressedPath, { recursive: true });

  const chunks = [];
  await new Promise((resolve, reject) => {
    const reader = createReadStream(archivePath);
    const brotli = createBrotliDecompress();
    reader.pipe(brotli);
    brotli.on("data", (c) => chunks.push(c));
    brotli.on("end", resolve);
    brotli.on("error", reject);
  });

  const content = Buffer.concat(chunks).toString();
  const parts = content.split("\n---END---\n").filter(Boolean);

  for (const part of parts) {
    const newlineIdx = part.indexOf("\n");
    const header = JSON.parse(part.slice(0, newlineIdx));
    const fileData = part.slice(newlineIdx + 1);

    const outPath = join(decompressedPath, header.path);

    await mkdir(dirname(outPath), { recursive: true });
    await new Promise((resolve, reject) => {
      const writer = createWriteStream(outPath);
      writer.write(fileData);
      writer.end();
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }
};

await decompressDir();
