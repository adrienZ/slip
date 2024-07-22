import { checkDbAndTables } from "@slip/database";
import type { Database } from "db0";

type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

export class SlipAuth {
  constructor(
    providedDatase: checkDbAndTablesParameters[0],
    dialect: checkDbAndTablesParameters[1],
  ) {
    checkDbAndTables(providedDatase, dialect);
  }
}
