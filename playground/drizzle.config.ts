import { defineConfig } from "drizzle-kit";
import path from "node:path";

function getDbUrl() {
  return path.resolve(__dirname, ".data/db.sqlite3");
}

export default defineConfig({
  dialect: "sqlite",
  out: "./migrations",
  schema: "./server/schemas.playground.ts",
  dbCredentials: {
    url: getDbUrl(),
  },
  verbose: true,
  strict: true,
});
