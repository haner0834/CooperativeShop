import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, "../public/sitemap.xml");

const sitemap = new SitemapStream({ hostname: "https://cooperativeshops.org" });

const urls = [
  { url: "/", changefreq: "weekly", priority: 0.8 },
  { url: "/schools", changefreq: "monthly", priority: 0.2 },
  { url: "/choose-school", changefreq: "weekly", priority: 0.8 },
  { url: "/qr-scanner", changefreq: "monthly", priority: 0.5 },
];

(async () => {
  const writeStream = createWriteStream(outputPath);
  sitemap.pipe(writeStream);

  urls.forEach((u) => sitemap.write(u));
  sitemap.end();

  await streamToPromise(sitemap);
  console.log("sitemap.xml generated.");
})();
