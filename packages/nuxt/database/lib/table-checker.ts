import type { Database } from "db0";

export class TableChecker {
  dbClient: Database;

  constructor(dbClient: Database) {
    this.dbClient = dbClient;
  }

  async checkUserTable(_tableName: string): Promise<boolean> {
    throw new Error("checkUserTable not implemented");
  }

  async checkSessionTable(
    _tableName: string,
    _usersTableName: string,
  ): Promise<boolean> {
    throw new Error("checkSessionTable not implemented");
  }

  async checkOauthAccountTable(_tableName: string, _usersTableName: string) {
    throw new Error("checkOauthAccountTable not implemented");
  }
}
