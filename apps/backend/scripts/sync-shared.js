import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsons = path.resolve(__dirname, "../shared/jsons/schools.json");
const jsonsTarget = path.resolve(__dirname, "../dist/src/shared/jsons/schools.json");

const appIcons = path.resolve(__dirname, "../shared/app-icons/logo-small.jpg")
const appIconsTarget = path.resolve(__dirname, "../dist/src/shared/app-icons/logo-small.jpg");

fs.copySync(jsons, jsonsTarget, { overwrite: true });
fs.copySync(appIcons, appIconsTarget, { overwrite: true });
console.log("✅ Copied shared into backend/shared");
