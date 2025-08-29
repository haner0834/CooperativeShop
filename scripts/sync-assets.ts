import fs from "fs-extra";
import path from "path";

const shared = path.resolve(__dirname, "../shared");
const target = path.resolve(__dirname, "../apps/frontend/src/shared");

fs.copySync(shared, target, { overwrite: true });
console.log("✅ Copied shared assets into frontend/src/shared");
