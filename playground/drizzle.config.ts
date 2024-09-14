import { defineConfig } from "drizzle-kit";
import path from "node:path";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(__dirname, ".data/db.sqlite3"),
  },
  verbose: true,
  strict: true,
});
