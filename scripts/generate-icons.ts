import fs from "fs-extra";
import path from "path";
import chokidar from "chokidar";

const ICONS_DIR = path.resolve(__dirname, "../shared/icons");
const OUTPUT_DIR = path.resolve(__dirname, "../apps/frontend/src/generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "icons.tsx");

function toPascalCase(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .split(/[-_]/g)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

async function generateIconsIndex() {
  try {
    const files = await fs.readdir(ICONS_DIR);
    const iconFiles = files.filter((f) =>
      [".svg", ".png", ".jpg", ".jpeg", ".gif"].includes(
        path.extname(f).toLowerCase()
      )
    );

    await fs.ensureDir(OUTPUT_DIR);

    const imports: string[] = [];
    const components: string[] = [];

    for (const f of iconFiles) {
      const name = toPascalCase(f);
      const ext = path.extname(f).toLowerCase();

      if (ext === ".svg") {
        // SVG 仍然用 React component
        imports.push(`import ${name}Icon from '@shared/icons/${f}?react';`);
        components.push(`
export const ${name} = (props: React.SVGProps<SVGSVGElement>) => {
  return <${name}Icon {...props} />;
};`);
      } else {
        // 圖片文件直接 import URL
        imports.push(`import ${name}Url from '@shared/icons/${f}';`);
        components.push(`
export const ${name} = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={${name}Url} {...props} />;
};`);
      }
    }

    const content = `import React from 'react';
${imports.join("\n")}

${components.join("\n\n")}
`;

    await fs.writeFile(OUTPUT_FILE, content, "utf8");
    console.log("✅ Icons index generated at", OUTPUT_FILE);
  } catch (err) {
    console.error("Error generating icons index:", err);
  }
}

generateIconsIndex();

chokidar.watch(ICONS_DIR, { ignoreInitial: true }).on("all", () => {
  console.log("Detected change in icons folder. Regenerating...");
  generateIconsIndex();
});
