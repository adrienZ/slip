import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("database", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("enabled nitro database", async () => {
    const json = await $fetch("/api/db-check");
    expect(json).toStrictEqual({
      cid: 0,
      dflt_value: null,
      name: "id",
      notnull: 0,
      pk: 0,
      type: "TEXT",
    });
  });

  it("auto-setup of db is not on error", async () => {
    const json = await $fetch("/api/auto-setup-check");
    expect(json).toStrictEqual({ validation: true });
  });

  it("module config is passed in runtime config", async () => {
    const json = await $fetch("/api/runtime-config");

    expect(json).toBeInstanceOf(Object);
    // @ts-expect-error its only testing
    expect(json.slipAuth).toStrictEqual({
      database: {
        dialect: "sqlite",
        nitroDatabaseName: "default",
      },
      sessionMaxAge: 604800,
      tableNames: {
        oauthAccounts: "slip_auth_oauth_accounts",
        sessions: "slip_auth_sessions",
        users: "slip_auth_users",
        emailVerificationCodes: "slip_auth_email_verification_codes",
      },
    });
  });
});
