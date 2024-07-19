import { Database } from "db0";

export class TableChecker {
  dbClient: Database

  constructor(dbClient: Database) {
    this.dbClient = dbClient
  }

  async checkUserTable(tableName: string): Promise<boolean> {
    return false
  }

  async checkSessionTable(tableName: string): Promise<boolean> {
  return false
}
}