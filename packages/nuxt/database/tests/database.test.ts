import { describe, it, expect } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { checkDatabaseValidity, checkDbAndTables } from "../index";

describe("checkDatabaseValidity", () => {
  it("should throw an error when no arguments are provided", () => {
    // @ts-expect-error testing no db
    expect(() => checkDatabaseValidity()).toThrow(
      "No database to check, please provide one",
    );
  });

  it("should throw an error when an invalid database is provided", () => {
    const invalidDatabase = {};
    expect(() =>
      checkDatabaseValidity(invalidDatabase, {
        users: "slip_users",
        sessions: "slip_sessions",
      }),
    ).toThrowError(
      "The provided database is not a valid db0 database, see https://github.com/unjs/db0",
    );
  });

  it("should throw an error when tableNames are missing", () => {
    // @ts-expect-error testing no table names
    expect(() => checkDatabaseValidity({})).toThrowError(
      "No tableNames provided for SlipAuth: { users: string, sessions: string, oauthAccounts: string }",
    );
  });

  it("should throw an error when tableNames are missing users table", () => {
    expect(() =>
      checkDatabaseValidity({}, { sessions: "slip_sessions" }),
    ).toThrowError(
      "tableNames provided for SlipAuth are incorrect, { users: string, sessions: string }",
    );
  });

  it("should throw an error when tableNames are missing sessions table", () => {
    expect(() =>
      checkDatabaseValidity({}, { users: "users_sessions" }),
    ).toThrowError(
      "tableNames provided for SlipAuth are incorrect, { users: string, sessions: string }",
    );
  });

  it("should throw an error when tableNames are from an incorrect type", () => {
    expect(() => checkDatabaseValidity({}, new Date())).toThrowError(
      "tableNames provided for SlipAuth are incorrect, { users: string, sessions: string }",
    );
  });

  it("should throw an error when tableNames have an empty value for a valid key", () => {
    expect(() =>
      checkDatabaseValidity({}, { users: "users_sessions", sessions: "" }),
    ).toThrowError(
      "tableNames provided for SlipAuth are incorrect, { users: string, sessions: string }",
    );
  });
});

describe("checkAndCreateDb", () => {
  it("should throw an error when unsupported connector are provided", async () => {
    const db = createDatabase(sqlite({
      name: "database.test",
    }));
    await expect(
      // @ts-expect-error testing unsupported
      checkDbAndTables(db, "notsupported", {
        users: "slip_users",
        sessions: "slip_sessions",
      }),
    ).rejects.toThrowError(
      "Invalid enum value. Expected 'sqlite', received 'notsupported'",
    );
  });
});
