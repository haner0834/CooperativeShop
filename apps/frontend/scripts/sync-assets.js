import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shared = path.resolve(__dirname, "../../../shared");
const target = path.resolve(__dirname, "../src/shared");

fs.copySync(shared, target, { overwrite: true });
console.log("✅ Copied shared assets into frontend/src/shared");
