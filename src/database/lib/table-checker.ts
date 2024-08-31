import type { Database } from "db0";
import type { tableNames } from "..";

export class TableChecker {
  dbClient: Database;
  tableNames: tableNames;

  constructor(dbClient: Database, tableNames: tableNames) {
    this.dbClient = dbClient;
    this.tableNames = tableNames;
  }

  async checkUserTable(): Promise<boolean> {
    throw new Error("checkUserTable not implemented");
  }

  async checkSessionTable(): Promise<boolean> {
    throw new Error("checkSessionTable not implemented");
  }

  async checkOauthAccountTable(): Promise<boolean> {
    throw new Error("checkOauthAccountTable not implemented");
  }
}
