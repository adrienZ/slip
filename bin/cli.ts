import { defineCommand, runMain } from "citty";
import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import consola from "consola";

const mapToEnv = (map: Map<unknown, unknown>) => Array.from(map).map(([key, value]) => `${key}=${value}`).join("\n");

const createFile = async (filePath: string, content: string) => {
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
      async run() {
        const envFilePath = path.resolve(process.cwd(), ".env");

        try {
          await fs.stat(envFilePath);
        }
        catch (error) {
          await fs.writeFile(envFilePath, "", {
            encoding: "utf-8",
          });
        }

        const dotEnvConfig = dotenv.config({
          path: envFilePath,
        });

        // @ts-expect-error TODO: fix the typing
        const parsedConfig = new Map(Object.entries(dotEnvConfig.parsed));

        if (!parsedConfig.has("NUXT_OAUTH_GITHUB_CLIENT_ID")) {
          // eslint-disable-next-line @stylistic/quotes
          parsedConfig.set("NUXT_OAUTH_GITHUB_CLIENT_ID", `""`);
        }

        if (!parsedConfig.has("NUXT_OAUTH_GITHUB_CLIENT_SECRET")) {
          // eslint-disable-next-line @stylistic/quotes
          parsedConfig.set("NUXT_OAUTH_GITHUB_CLIENT_SECRET", `""`);
        }

        if (!parsedConfig.has("NUXT_SLIP_AUTH_IP_INFO_TOKEN")) {
          // eslint-disable-next-line @stylistic/quotes
          parsedConfig.set("NUXT_SLIP_AUTH_IP_INFO_TOKEN", `""`);
        }

        await fs.writeFile(envFilePath, mapToEnv(parsedConfig));
        const logger = consola.withTag("slip-auth-demo");
        logger.success(".env setup");

        const githubHandlerFilePath = path.resolve(process.cwd(), "server/routes/githoub.get.ts");

        try {
          await fs.stat(githubHandlerFilePath);
        }
        catch (error) {
          await createFile(githubHandlerFilePath, `
export default oauthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const auth = useSlipAuth();

    const [userId, sessionFromDb] = await auth.registerUserIfMissingInDb({
      email: user.email,
      providerId: "github",
      providerUserId: user.id,
      ua: getRequestHeader(event, "User-Agent"),
      ip: getRequestIP(event),
    });

    await setUserSession(event, {
      expires_at: sessionFromDb.expires_at,
      id: sessionFromDb.id,
      user: {
        id: userId,
      },
    });
    return sendRedirect(event, "/");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
            `);
        }
      },
    }),
  },
});

runMain(main);