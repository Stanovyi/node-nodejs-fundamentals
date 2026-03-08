import { createReadStream, createWriteStream } from "fs";
import { readdir, stat, mkdir, access } from "fs/promises";
import { createBrotliCompress } from "zlib";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";

const directoryName = dirname(fileURLToPath(import.meta.url));

const compressDir = async () => {
  const toCompressPath = join(directoryName, "workspace", "toCompress");
  const compressedPath = join(directoryName, "workspace", "compressed");
  const archivePath = join(compressedPath, "archive.br");


  await access(toCompressPath).catch(() => {
    throw new Error("FS operation failed");
  });


  await mkdir(compressedPath, { recursive: true });


  const allFiles = [];
  async function scan(dir) {
    const items = await readdir(dir);
    for (const item of items) {
      const full = join(dir, item);
      const info = await stat(full);
      if (info.isDirectory()) {
        await scan(full);
      } else {
        allFiles.push(full);
      }
    }
  }
  await scan(toCompressPath);


  const writer = createWriteStream(archivePath);
  const brotli = createBrotliCompress();
  brotli.pipe(writer);

  for (const filePath of allFiles) {
    const relPath = relative(toCompressPath, filePath);
    const info = await stat(filePath);
    const fileData = await new Promise((resolve, reject) => {
      const chunks = [];
      const reader = createReadStream(filePath);
      reader.on("data", (c) => chunks.push(c));
      reader.on("end", () => resolve(Buffer.concat(chunks)));
      reader.on("error", reject);
    });


    const header = JSON.stringify({ path: relPath, size: info.size }) + "\n";
    brotli.write(header);
    brotli.write(fileData);
    brotli.write("\n---END---\n");
  }

  brotli.end();
  await new Promise((resolve) => writer.on("finish", resolve));
};

await compressDir();
