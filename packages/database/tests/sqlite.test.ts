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
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" NUMBER PRIMARY KEY)`;
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

      it("should throw an error when users table does not have an email field with of text", async () => {
        await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" NUMBER)`;
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
					await db.sql`CREATE TABLE IF NOT EXISTS users ("sessions" NUMBER PRIMARY KEY)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						`sessions table must contain a column "id" with type "TEXT"`,
					);
				});

				it("should throw an error when sessions table does not have a not nullable id field", async () => {
					await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT PRIMARY KEY, "email" TEXT)`;
					await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(
						`sessions table must contain a column "id" not nullable`,
					);
				});
			});
		})

});

// CREATE TABLE session (
//     id TEXT NOT NULL PRIMARY KEY,
//     expires_at INTEGER NOT NULL,
//     user_id TEXT NOT NULL,
//     FOREIGN KEY (user_id) REFERENCES user(id)
// )