import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sqlite from "db0/connectors/better-sqlite3";
import { checkDbAndTables } from "../index";
import { createDatabase } from "db0";

const dbPath = path.resolve(import.meta.dirname, "../.data/db.sqlite3");
let db = createDatabase(sqlite({}));

beforeEach(() => {
  try {
    fs.statSync(dbPath);
    fs.rmSync(dbPath);
  } catch (error) {}

  db = createDatabase(sqlite({}));
});

describe("sqlite connector", () => {
  describe("users table", () => {
    describe("id field", () => {
      it("should throw an error when users table does not exist in database", async () => {
        const db = createDatabase(sqlite({}));
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          "users table for SLIP does not exist",
        );
      });

      it("should throw an error when users table does not have an id field", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS users ("notid" TEXT PRIMARY KEY)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          'users table must contain a column with name "id"',
        );
      });

      it("should throw an error when users table does not have an id field as primary key", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          `users table must contain a column "id" as primary key`,
        );
      });

      it("should throw an error when users table does not have an id field with type of text", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" INTEGER PRIMARY KEY)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          `table must contain a column "id" with type "TEXT"`,
        );
      });

      it("should throw an error when users table does not have a not nullable id field", async () => {
        const db = createDatabase(sqlite({}));
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "email" TEXT)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          `users table must contain a column "id" not nullable`,
        );
      });
    });

    describe("email field", () => {
      it("should throw an error when users table does not have an email field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          'users table must contain a column with name "email"',
        );
      });

      it("should throw an error when users table does not have an email field with type of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" INTEGER)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          `table must contain a column "email" with type "TEXT"`,
        );
      });

      it("should throw an error when users table does not have an not nullable email field", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT)`;
        await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
          `users table must contain a column "email" not nullable`,
        );
      });
    });
  });

  describe("sessions table", () => {
    const validUsersTableSetup = () => db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`

      beforeEach(async () => {
        await validUsersTableSetup();
      })

			describe("id field", () => {

				it("should throw an error when sessions table does not exist in database", async () => {
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						"sessions table for SLIP does not exist",
					);
				});

				it("should throw an error when sessions table does not have an id field", async () => {
					await db.sql`CREATE TABLE IF NOT EXISTS sessions ("notid" TEXT)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						'sessions table must contain a column with name "id"',
					);
				});

				it("should throw an error when sessions table does not have an id field as primary key", async () => {
					await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						`sessions table must contain a column "id" as primary key`,
					);
				});

				it("should throw an error when sessions table does not have an id field with type of text", async () => {
					await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" INTEGER PRIMARY KEY)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						`sessions table must contain a column "id" with type "TEXT"`,
					);
				});

				it("should throw an error when sessions table does not have a not nullable id field", async () => {
					await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT PRIMARY KEY)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						`sessions table must contain a column "id" not nullable`,
					);
				});
			});

      describe("expires_at field", () => {
        it("should throw an error when sessions table does not have an expires_at field", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            'sessions table must contain a column with name "expires_at"',
          );
        });

        it("should throw an error when sessions table does not have an expires_at field with type of number", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" DATE)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table must contain a column "expires_at" with type "INTEGER"`,
          );
        });

        it("should throw an error when sessions table does not have an not nullable expires_at field", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table must contain a column "expires_at" not nullable`,
          );
        });
      });

      describe("user_id field", () => {

        // it("should throw an error when sessions table does not have an user_id field", async () => {
        //   await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL)`;
        //   await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
        //     'sessions table must contain a column with name "user_id"',
        //   );
        // });

        it("should throw an error when sessions table does not have a user_id foreign key", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table should have a foreign key "user_id"`,
          );
        });

        it("should throw an error when sessions table does not have an user_id field with type of number", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" BLOB)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table must contain a column "user_id" with type "TEXT"`,
          );
        });

        it("should throw an error when sessions table does not have an not nullable user_id field", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT, FOREIGN KEY (user_id) REFERENCES user(id))`;

          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table must contain a column "user_id" not nullable`,
          );
        });

        it("should throw an error when sessions table does not have a user_id foreign key", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL)`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `sessions table should have a foreign key "user_id"`,
          );
        });

        it("should throw an error when sessions table does not have a user_id foreign key to user table", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS othertable ("id" TEXT)`;
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES othertable(id))`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `foreign key "user_id" in sessions table should target the the "id" column from the "user" table`,
          );
        });

        it("should throw an error when sessions table does not have a user_id foreign key to user table \"id\" column", async () => {
          await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES user(email))`;
          await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
            `foreign key "user_id" in sessions table should target the the "id" column from the "user" table`,
          );
        });
      });
		})
});