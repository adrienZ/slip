import { defineConfig } from "drizzle-kit";
import path from "node:path";

export default defineConfig({
  // out: "./server/database/migrations",
  // schema: "./server/database/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(__dirname, ".data/db.sqlite3"),
  },
  verbose: true,
  strict: true,
});
