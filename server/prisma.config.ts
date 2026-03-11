import path from "node:path";
import { defineConfig, env } from '@prisma/config';
import dotenv from 'dotenv';
import "dotenv/config";

dotenv.config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: "prisma/migrations",
    seed: 'tsx prisma/seed.ts'
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
