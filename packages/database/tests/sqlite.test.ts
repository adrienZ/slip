import { describe, it, expect, beforeEach } from 'vitest';
import fs from "node:fs";
import path from "node:path";
import sqlite from "db0/connectors/better-sqlite3";
import { checkDbAndTables } from "../index"
import { createDatabase } from 'db0';

const dbPath = path.resolve(import.meta.dirname, "../.data/db.sqlite3");
beforeEach(() => {

  try {
    fs.statSync(dbPath)
    fs.rmSync(dbPath)
  } catch (error) {
  }
})

describe('sqlite connector', () => {

  describe("users table", () => {
    it('should throw an error when users table does not exist in database', async () => {
      const db = createDatabase(sqlite({}));
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError("users table for SLIP does not exist");
    });

    it('should throw an error when users table does not have an id field as primary key', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(`users table must contain a column "id" as primary key`);
    });

    it('should throw an error when users table does not have an id field', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("notid" TEXT PRIMARY KEY)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError("users table must contain a column with name \"id\"");
    });


    it('should throw an error when users table does not have an id field with of text', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("id" NUMBER PRIMARY KEY)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(`table must contain a column "id" with type "TEXT"`);
    });

    it('should throw an error when users table does not have an email field', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError("users table must contain a column with name \"email\"");
    });


    it('should throw an error when users table does not have an email field with of text', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "email" NUMBER)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(`table must contain a column "email" with type "TEXT"`);
    });

    it('should throw an error when users table does not have an non nullable email field', async () => {
      const db = createDatabase(sqlite({}));
      await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "email" TEXT)`;
      await expect(checkDbAndTables(db, "sqlite")).rejects.toThrowError(`users table must contain a column "email" non nullable`);
    });
  })

});