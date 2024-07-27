import { z } from "zod";
import { TableChecker } from "./table-checker";

const sqliteTableInfoRowSchema = z.object({
  cid: z.number(),
  name: z.string(),
  type: z.string(),
  notnull: z.number(),
  dflt_value: z.any(),
  pk: z.number(),
});

interface ColumnDefinition {
  name: string;
  type?: string;
  pk?: boolean;
  notnull?: boolean;
}

const createTableSchema = (tableName: string, requiredColumns: ColumnDefinition[]) => {
  let schema = z
    .array(sqliteTableInfoRowSchema)
    .min(1, `${tableName} table for SLIP does not exist`);
  
  requiredColumns.forEach(({ name, type, pk, notnull }) => {
    schema = schema.refine(arr => arr.some(item => item.name === name), {
      message: `${tableName} table must contain a column with name "${name}"`,
    });
    if (type) {
      schema = schema.refine(arr => arr.some(item => item.name === name && item.type === type), {
        message: `${tableName} table must contain a column "${name}" with type "${type}"`,
      });
    }
    if (pk) {
      schema = schema.refine(arr => arr.some(item => item.name === name && item.pk === 1), {
        message: `${tableName} table must contain a column "${name}" as primary key`,
      });
    }
    if (notnull) {
      schema = schema.refine(arr => arr.some(item => item.name === name && item.notnull === 1), {
        message: `${tableName} table must contain a column "${name}" not nullable`,
      });
    }
  });

  return schema;
};

const UserTableSchema = createTableSchema("users", [
  { name: "id", type: "TEXT", pk: true, notnull: true },
  { name: "email", type: "TEXT", notnull: true },
]);

const SessionTableSchema = createTableSchema("sessions", [
  { name: "id", type: "TEXT", pk: true, notnull: true },
  { name: "expires_at", type: "INTEGER", notnull: true },
  { name: "user_id", type: "TEXT", notnull: true },
]);

export class SqliteTableChecker extends TableChecker {
  async checkUserTable(tableName: string) {
    const tableInfo = await this.dbClient
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    const { success, error } = UserTableSchema.safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    return success;
  }

  async checkSessionTable(tableName: string) {
    const tableInfo = await this.dbClient
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    const { success, error } = SessionTableSchema.safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    const foreignKeys = (await this.dbClient
      .prepare(`PRAGMA foreign_key_list(${tableName})`)
      .all()) as Array<{ table?: string; from?: string; to?: string }>;

    const userIdForeignKey = foreignKeys.find(
      (columnInfo) => columnInfo.from === "user_id",
    );

    if (!userIdForeignKey) {
      throw new Error(`${tableName} table should have a foreign key "user_id"`);
    }

    if (userIdForeignKey.table !== "user" || userIdForeignKey.to !== "id") {
      throw new Error(
        `foreign key "user_id" in ${tableName} table should target "id" column from the "user" table`,
      );
    }

    return success;
  }
}
