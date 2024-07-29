import type { Database } from "db0";

export class TableChecker {
  dbClient: Database;

  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async checkUserTable(tableName: string): Promise<boolean> {
    throw new Error("checkUserTable not implemented");
  }

  async checkSessionTable(
    tableName: string,
    usersTableName: string,
  ): Promise<boolean> {
    throw new Error("checkSessionTable not implemented");
  }

  async checkOauthAccountTable(tableName: string, usersTableName: string) {
    throw new Error("checkOauthAccountTable not implemented");
  }
}
