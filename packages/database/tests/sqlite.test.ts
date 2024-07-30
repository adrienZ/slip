import { describe, it, expect, beforeEach } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { checkDbAndTables } from "../index";
import { createDatabase } from "db0";

const db = createDatabase(sqlite({}));

beforeEach(async () => {
  await db.sql`DROP TABLE IF EXISTS slip_users`;
  await db.sql`DROP TABLE IF EXISTS slip_sessions`;
  await db.sql`DROP TABLE IF EXISTS slip_oauth_accounts`;
});

describe("sqlite connector", () => {
  describe("users table", () => {
    describe("id field", () => {
      it("should throw an error when users table does not exist in database", async () => {
        const db = createDatabase(sqlite({}));
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError("slip_users table for SLIP does not exist");
      });

      it("should throw an error when users table does not have an id field", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("notid" TEXT PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_users table must contain a column with name "id"',
        );
      });

      it("should throw an error when users table does not have an id field as primary key", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_users table must contain a column "id" as primary key`,
        );
      });

      it("should throw an error when users table does not have an id field with type of text", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" INTEGER PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_users table must contain a column "id" with type "TEXT"`,
        );
      });

      it("should throw an error when users table does not have a not nullable id field", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT PRIMARY KEY, "email" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_users table must contain a column "id" not nullable`,
        );
      });
    });

    describe("email field", () => {
      it("should throw an error when users table does not have an email field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_users table must contain a column with name "email"',
        );
      });

      it("should throw an error when users table does not have an email field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" INTEGER)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_users table must contain a column "email" with type "TEXT"`,
        );
      });

      it("should throw an error when users table does not have an not nullable email field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_users table must contain a column "email" not nullable`,
        );
      });
    });
  });

  describe("sessions table", () => {
    const validUsersTableSetup = () =>
      db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;

    beforeEach(async () => {
      await validUsersTableSetup();
    });

    describe("id field", () => {
      it("should throw an error when sessions table does not exist in database", async () => {
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError("slip_sessions table for SLIP does not exist");
      });

      it("should throw an error when sessions table does not have an id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("notid" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_sessions table must contain a column with name "id"',
        );
      });

      it("should throw an error when sessions table does not have an id field as primary key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "id" as primary key`,
        );
      });

      it("should throw an error when sessions table does not have an id field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" INTEGER PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "id" with type "TEXT"`,
        );
      });

      it("should throw an error when sessions table does not have a not nullable id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "id" not nullable`,
        );
      });
    });

    describe("expires_at field", () => {
      it("should throw an error when sessions table does not have an expires_at field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_sessions table must contain a column with name "expires_at"',
        );
      });

      it("should throw an error when sessions table does not have an expires_at field with type of number", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" DATE)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "expires_at" with type "INTEGER"`,
        );
      });

      it("should throw an error when sessions table does not have an not nullable expires_at field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "expires_at" not nullable`,
        );
      });
    });

    describe("user_id field", () => {
      // it("should throw an error when sessions table does not have an user_id field", async () => {
      //   await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL)`;
      //   await expect(checkDbAndTables(db, "sqlite", { users: "slip_users", sessions: "slip_sessions", oauthAccounts: "slip_oauth_accounts" })).rejects.toThrowError(
      //     'sessions table must contain a column with name "user_id"',
      //   );
      // });

      it("should throw an error when sessions table does not have a user_id foreign key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table should have a foreign key "user_id"`,
        );
      });

      it("should throw an error when sessions table does not have an user_id field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" BLOB)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "user_id" with type "TEXT"`,
        );
      });

      it("should throw an error when sessions table does not have an not nullable user_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT)`;

        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table must contain a column "user_id" not nullable`,
        );
      });

      it("should throw an error when sessions table does not have a user_id foreign key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_sessions table should have a foreign key "user_id"`,
        );
      });

      it("should throw an error when sessions table does not have a user_id foreign key to user table", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS othertable ("id" TEXT)`;
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES othertable(id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `foreign key "user_id" in slip_sessions table should target "id" column from the "slip_users" table`,
        );
      });

      it('should throw an error when sessions table does not have a user_id foreign key to user table "id" column', async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES slip_users(email))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `foreign key "user_id" in slip_sessions table should target "id" column from the "slip_users" table`,
        );
      });
    });
  });

  describe("slip_oauth_accounts table", () => {
    const validUsersTableSetup = () =>
      db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
    const validSessionsTableSetup = () =>
      db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES slip_users(id))`;

    beforeEach(async () => {
      await validUsersTableSetup();
      await validSessionsTableSetup();
    });

    describe("provider_id field", () => {
      it("should throw an error when oauth table does not exist in database", async () => {
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          "slip_oauth_accounts table for SLIP does not exist",
        );
      });

      it("should throw an error when oauth table does not have an provider_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("notid" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_oauth_accounts table must contain a column with name "provider_id"',
        );
      });

      it("should throw an error when oauth table does not have an provider_id field as primary key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_id" as primary key`,
        );
      });

      it("should throw an error when oauth table does not have an provider_id field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" INTEGER PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_id" with type "TEXT"`,
        );
      });

      it("should throw an error when oauth table does not have a not nullable provider_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_id" not nullable`,
        );
      });
    });

    describe("provider_user_id field", () => {
      it("should throw an error when oauth table does not have an provider_user_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL PRIMARY KEY)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          'slip_oauth_accounts table must contain a column with name "provider_user_id"',
        );
      });

      it("should throw an error when oauth table does not have an provider_user_id field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL PRIMARY KEY, "provider_user_id" INTEGER)`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_user_id" with type "TEXT"`,
        );
      });

      it("should throw an error when oauth table does not have an provider_user_id field as primary key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT, PRIMARY KEY (provider_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_user_id" as primary key`,
        );
      });

      it("should throw an error when oauth table does not have a not nullable provider_user_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT, PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "provider_user_id" not nullable`,
        );
      });
    });

    describe("user_id field", () => {
      it("should throw an error when slip_oauth_accounts table does not have a user_id foreign key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table should have a foreign key "user_id"`,
        );
      });

      it("should throw an error when slip_oauth_accounts table does not have an user_id field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" BLOB, PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "user_id" with type "TEXT"`,
        );
      });

      it("should throw an error when slip_oauth_accounts table does not have an not nullable user_id field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT, PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table must contain a column "user_id" not nullable`,
        );
      });

      it("should throw an error when slip_oauth_accounts table does not have a user_id foreign key", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `slip_oauth_accounts table should have a foreign key "user_id"`,
        );
      });

      it("should throw an error when slip_oauth_accounts table does not have a user_id foreign key to user table", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS othertable ("id" TEXT)`;
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES othertable(id), PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `foreign key "user_id" in slip_oauth_accounts table should target "id" column from the "slip_users" table`,
        );
      });

      it('should throw an error when slip_oauth_accounts table does not have a user_id foreign key to user table "id" column', async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES slip_users(email), PRIMARY KEY (provider_id, provider_user_id))`;
        await expect(
          checkDbAndTables(db, "sqlite", {
            users: "slip_users",
            sessions: "slip_sessions",
            oauthAccounts: "slip_oauth_accounts",
          }),
        ).rejects.toThrowError(
          `foreign key "user_id" in slip_oauth_accounts table should target "id" column from the "slip_users" table`,
        );
      });
    });
  });
});
