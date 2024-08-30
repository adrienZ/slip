import { z } from "zod";
import { type PrimaryKey, getTableConfig, type SQLiteColumn } from "drizzle-orm/sqlite-core";
import { TableChecker } from "./table-checker";
import { usersTable, oAuthAccountsTable, sessionsTable } from "./schema";

const sqliteTableInfoRowSchema = z.object({
  cid: z.number(),
  name: z.string(),
  type: z.string(),
  notnull: z.number(),
  dflt_value: z.any(),
  pk: z.number(),
});

const sqliteDrizzleColumnTypeMapping = {
  SQLiteText: "TEXT",
  SQLiteInteger: "INTEGER",
};
function getSQLiteColumType(drizzleColumnType: string) {
  return sqliteDrizzleColumnTypeMapping[drizzleColumnType as keyof typeof sqliteDrizzleColumnTypeMapping] || drizzleColumnType;
}

const validateTableSchema = (
  tableName: string,
  drizzleTableInfos: { columns: SQLiteColumn[], primaryKeys: PrimaryKey[] },
) => {
  let schema = z
    .array(sqliteTableInfoRowSchema)
    .min(1, `${tableName} table for SLIP does not exist`);

  const primaryKeysColumnsNames = drizzleTableInfos.primaryKeys.at(0)?.columns.map(col => col.name);

  for (const { name, columnType, primary, notNull } of drizzleTableInfos.columns) {
    schema.refine(arr => arr.some(item => item.name === name), {
      message: `${tableName} table must contain a column with name "${name}"`,
    });
    if (columnType) {
      schema.refine(
        arr => arr.some(item => item.name === name && item.type === getSQLiteColumType(columnType)),
        {
          message: `${tableName} table must contain a column "${name}" with type "${getSQLiteColumType(columnType)}"`,
        },
      );
    }

    if (primary || primaryKeysColumnsNames?.includes(name)) {
      schema.refine(
        arr =>
          arr.some(
            item =>
              item.name === name && typeof item.pk === "number" && item.pk > 0,
          ),
        {
          message: `${tableName} table must contain a column "${name}" as primary key`,
        },
      );
    }
    if (notNull) {
      schema.refine(
        arr => arr.some(item => item.name === name && item.notnull === 1),
        {
          message: `${tableName} table must contain a column "${name}" not nullable`,
        },
      );
    }
  };

  return schema;
};

const UserTableSchema = (usersTableName: string) =>
  validateTableSchema(usersTableName, getTableConfig(usersTable));

const SessionTableSchema = (sessionsTableName: string) =>
  validateTableSchema(sessionsTableName, getTableConfig(sessionsTable));

const OauthAccountTableSchema = (oauthAccountTableName: string) =>
  validateTableSchema(oauthAccountTableName, getTableConfig(oAuthAccountsTable));

export class SqliteTableChecker extends TableChecker {
  override async checkUserTable(tableName: string) {
    const tableInfo = await this.dbClient
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();

    const { success, error } = UserTableSchema(tableName).safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    return success;
  }

  override async checkSessionTable(tableName: string, usersTableName: string) {
    const tableInfo = await this.dbClient
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    const { success, error }
      = SessionTableSchema(tableName).safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    const foreignKeys = (await this.dbClient
      .prepare(`PRAGMA foreign_key_list(${tableName})`)
      .all()) as Array<{ table?: string, from?: string, to?: string }>;

    const userIdForeignKey = foreignKeys.find(
      columnInfo => columnInfo.from === "user_id",
    );

    if (!userIdForeignKey) {
      throw new Error(`${tableName} table should have a foreign key "user_id"`);
    }

    if (
      userIdForeignKey.table !== usersTableName
      || userIdForeignKey.to !== "id"
    ) {
      throw new Error(
        `foreign key "user_id" in ${tableName} table should target "id" column from the "${usersTableName}" table`,
      );
    }

    return success;
  }

  override async checkOauthAccountTable(tableName: string, usersTableName: string) {
    const tableInfo = await this.dbClient
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    const { success, error }
      = OauthAccountTableSchema(tableName).safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    const foreignKeys = (await this.dbClient
      .prepare(`PRAGMA foreign_key_list(${tableName})`)
      .all()) as Array<{ table?: string, from?: string, to?: string }>;

    const userIdForeignKey = foreignKeys.find(
      columnInfo => columnInfo.from === "user_id",
    );

    if (!userIdForeignKey) {
      throw new Error(`${tableName} table should have a foreign key "user_id"`);
    }

    if (
      userIdForeignKey.table !== usersTableName
      || userIdForeignKey.to !== "id"
    ) {
      throw new Error(
        `foreign key "user_id" in ${tableName} table should target "id" column from the "${usersTableName}" table`,
      );
    }

    return success;
  }
}
