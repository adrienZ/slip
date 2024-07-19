import { describe, it, expect } from 'vitest';
import sqlite from 'db0/connectors/better-sqlite3';
import { checkDatabaseValidity, checkDbAndTables } from "../index"
import { createDatabase } from 'db0';

describe('checkDatabaseValidity', () => {
  it('should throw an error when no arguments are provided', () => {
    // @ts-expect-error
    expect(() => checkDatabaseValidity()).toThrow('No database to check, please provide one');
  });

  it('should throw an error when an invalid database is provided', () => {
    const invalidDatabase = {};
    expect(() => checkDatabaseValidity(invalidDatabase)).toThrowError("The provided database is not a valid db0 database, see https://github.com/unjs/db0");
  });
})


describe('checkAndCreateDb', () => {
  it('should throw an error when unsupported connector are provided', async () => {
    const db = createDatabase(sqlite({}));
    // @ts-expect-error
    await expect(checkDbAndTables(db, "notsupported")).rejects.toThrowError("Invalid enum value. Expected 'sqlite', received 'notsupported'");
  });
})