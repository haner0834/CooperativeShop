import { defineConfig } from "prisma/config";
import { config } from "dotenv";
config();

export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma",
    seed: "ts-node prisma/seed.ts",
  },
});
