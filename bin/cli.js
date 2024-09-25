// #!/usr/bin/env node
// @ts-check
import { defineCommand, runMain } from "citty";
import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import consola from "consola";
import { execSync } from "node:child_process";

/**
 * Converts a Map to a string that can be written to an .env file.
 * @param {Map<string, string>} map - The map of environment variables.
 * @returns {string} - The formatted string for the .env file.
 */
const mapToEnv = map => Array.from(map).map(([key, value]) => `${key}=${value}`).join("\n");

/**
 * Creates a file at the given path with the specified content. If the directory doesn't exist, it is created.
 * @param {string} filePath - The path where the file will be created.
 * @param {string} content - The content to write to the file.
 */
const createFile = async (filePath, content) => {
  try {
    // Get the directory path from the file path
    const dir = path.dirname(filePath);

    // Check if the directory exists, and create it if not
    try {
      await fs.access(dir);
    }
    catch {
      // Directory does not exist, create it
      await fs.mkdir(dir, { recursive: true });
    }

    // Write content to the file
    await fs.writeFile(filePath, content);
    console.log("File created successfully:", filePath);
  }
  catch (err) {
    console.error("Error:", err);
  }
};

/**
 * Main command definition using citty CLI framework.
 */
const main = defineCommand({
  meta: {
    name: "Slip Auth CLI",
    version: "0.0.1",
    description: "Slip Auth setup helper",
  },
  subCommands: {
    demo: defineCommand({
      meta: {
        name: "demo",
      },
      /**
       * Main execution of the demo command.
       */
      async run() {
        const envFilePath = path.resolve(process.cwd(), ".env");

        try {
          await fs.stat(envFilePath);
        }
        catch {
          await fs.writeFile(envFilePath, "", {
            encoding: "utf-8",
          });
        }

        const dotEnvConfig = dotenv.config({
          path: envFilePath,
        });

        const parsedConfig = new Map(Object.entries(dotEnvConfig.parsed ?? {}));

        if (!parsedConfig.has("NUXT_OAUTH_GITHUB_CLIENT_ID")) {
          parsedConfig.set("NUXT_OAUTH_GITHUB_CLIENT_ID", "\"\"");
        }

        if (!parsedConfig.has("NUXT_OAUTH_GITHUB_CLIENT_SECRET")) {
          parsedConfig.set("NUXT_OAUTH_GITHUB_CLIENT_SECRET", "\"\"");
        }

        if (!parsedConfig.has("NUXT_SLIP_AUTH_IP_INFO_TOKEN")) {
          parsedConfig.set("NUXT_SLIP_AUTH_IP_INFO_TOKEN", "\"\"");
        }

        await fs.writeFile(envFilePath, mapToEnv(parsedConfig));
        const logger = consola.withTag("slip-auth-demo");
        logger.success(".env setup");

        const githubHandlerFilePath = path.resolve(process.cwd(), "server/routes/auth/github.get.ts");

        try {
          await fs.stat(githubHandlerFilePath);
          logger.warn("github demo already setup");
        }
        catch {
          logger.info("fetching github handler on github");
          const githubFileRequest = await fetch("https://raw.githubusercontent.com/adrienZ/slip/refs/heads/master/playground/server/routes/auth/github.get.ts");          
          await createFile(githubHandlerFilePath, await githubFileRequest.text());
          logger.success("github demo route setup");
        }

        execSync("npx --yes nypm@latest install better-sqlite3");
        logger.success(".better-sqlite3 installed");
      },
    }),
  },
});

runMain(main);
