import fs from "fs-extra";
import path from "path";
import chokidar from "chokidar";

// const iconsDir = path.resolve("apps/frontend/src/generated/icons");
// const outFile = path.resolve("apps/frontend/src/generated/icons.tsx");

// const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".tsx"));

// const exportss = files.map((f) => {
//   const name = path.basename(f, ".tsx");
//   return `export { default as ${name} } from './icons/${name}';`;
// });

// fs.writeFileSync(outFile, exportss.join("\n") + "\n");
// console.log(`✅ Generated ${outFile}`);

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
        // 直接導入 SVG 組件
        imports.push(`import ${name}Icon from '@shared/icons/${f}?react';`);
        components.push(`
export const ${name} = (props: React.SVGProps<SVGSVGElement>) => {
  return <${name}Icon {...props} />;
};`);
        // imports.push(`export { default as ${name} } from './icons/${name}'`);
      } else {
        // 圖片文件使用懶加載（保持原邏輯）
        components.push(`
export const ${name} = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/${f}').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "${name}";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};`);
      }
    }

    const content = `import React from 'react';
${imports.join("\n")}

${components.join("\n\n")}
`;

    await fs.writeFile(OUTPUT_FILE, content, "utf8");
    console.log("✅ Icons index generated (direct SVG import) at", OUTPUT_FILE);
  } catch (err) {
    console.error("Error generating icons index:", err);
  }
}

generateIconsIndex();

chokidar.watch(ICONS_DIR, { ignoreInitial: true }).on("all", () => {
  console.log("Detected change in icons folder. Regenerating...");
  generateIconsIndex();
});
