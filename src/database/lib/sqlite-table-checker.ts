import { type PrimaryKey, getTableConfig, type SQLiteColumn, type ForeignKey } from "drizzle-orm/sqlite-core";
import { getTableName } from "drizzle-orm";
import type { Database } from "db0";
import { z } from "zod";
import { TableChecker } from "./table-checker";
import { getUsersTableSchema, getOAuthAccountsTableSchema, getSessionsTableSchema } from "./schema";

// #region HELPERS
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

function createSQLiteTableExistSchema(tableName: string) {
  return z
    .array(sqliteTableInfoRowSchema)
    .min(1, `${tableName} table for SLIP does not exist`);
}

const findColumnInSQLiteTableInfo = <T extends { name: string }>(source: T[], columnName: string) => {
  return source.find(columnFromSQLite => columnFromSQLite.name === columnName);
};
const findColumnInSQLiteTableForeignKeys = <T extends { from: string }>(source: T[], columnName: string) => {
  return source.find(columnFromSQLite => columnFromSQLite.from === columnName);
};
// #endregion

async function validateDabaseWithSchema(db: Database, tableName: string, drizzleTableInfos: { columns: SQLiteColumn[], primaryKeys: PrimaryKey[], foreignKeys: ForeignKey[] }): Promise<string | null> {
  const maybeTableInfo = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  const { success, error, data: tableInfo } = createSQLiteTableExistSchema(tableName).safeParse(maybeTableInfo);

  if (!success) {
    throw new Error(error.errors[0].message);
  };

  // Check if all columns from schema exist in SQLite table
  for (const columnFromSchema of drizzleTableInfos.columns) {
    const correspondingColumn = findColumnInSQLiteTableInfo(tableInfo, columnFromSchema.name);

    if (!correspondingColumn) {
      return `${tableName} table must contain a column with name "${columnFromSchema.name}"`;
    }

    if (correspondingColumn.type !== getSQLiteColumType(columnFromSchema.columnType)) {
      return `${tableName} table must contain a column "${columnFromSchema.name}" with type "${getSQLiteColumType(columnFromSchema.columnType)}"`;
    }

    const primaryKeysColumnsNames = drizzleTableInfos.primaryKeys.at(0)?.columns.map(col => col.name);
    if ((columnFromSchema.primary || primaryKeysColumnsNames?.includes(columnFromSchema.name)) && correspondingColumn.pk < 1) {
      return `${tableName} table must contain a column "${columnFromSchema.name}" as primary key`;
    }

    if (columnFromSchema.notNull && correspondingColumn.notnull !== 1) {
      return `${tableName} table must contain a column "${columnFromSchema.name}" not nullable`;
    }

    const indexesInTableSQLite = (await db
      .prepare(`PRAGMA INDEX_LIST(${tableName})`)
      .all()) as Array<{ name: string, origin: string, unique: number }>;

    const uniqueIndexesSQLite = await Promise.all(indexesInTableSQLite.filter((indexData) => {
      return indexData.origin === "u" && indexData.unique === 1;
    }).map((uniqueIndex) => {
      return db
        .prepare(`PRAGMA index_info(${uniqueIndex.name})`)
        .all() as Promise<Array<{ name: string }>>;
    }));

    if (columnFromSchema.isUnique && uniqueIndexesSQLite.find(uniqueIndex => columnFromSchema.name === uniqueIndex.at(0)?.name) === undefined) {
      return `${tableName} table must contain a column "${columnFromSchema.name}" unique`;
    }
  }

  const foreignKeysTable = drizzleTableInfos.foreignKeys;
  const foreignKeysSQLite = (await db
    .prepare(`PRAGMA foreign_key_list(${tableName})`)
    .all()) as Array<{ table: string, from: string, to: string, name: string }>;

  for (const foreignKeyData of foreignKeysTable) {
    const reference = foreignKeyData.reference();

    for (const foreignKeyColumn of reference.columns) {
      const fcorrespondingColumn = findColumnInSQLiteTableForeignKeys(foreignKeysSQLite, foreignKeyColumn.name);

      if (!fcorrespondingColumn) {
        return `${tableName} table should have a foreign key "${foreignKeyColumn.name}"`;
      }

      const targetTableName = getTableName(reference.foreignTable);
      const targetColumnName = reference.foreignColumns[0].name;
      if (fcorrespondingColumn.table !== targetTableName || fcorrespondingColumn.to !== targetColumnName) {
        return `foreign key "${fcorrespondingColumn.from}" in ${tableName} table should target "${targetColumnName}" column from the "${targetTableName}" table`;
      }
    }
  }

  return null;
}

export class SqliteTableChecker extends TableChecker {
  override async checkUserTable() {
    const error = await validateDabaseWithSchema(this.dbClient, this.tableNames.users, getTableConfig(getUsersTableSchema(this.tableNames)));

    if (error) {
      throw new Error(error);
    }

    return true;
  }

  override async checkSessionTable() {
    const error = await validateDabaseWithSchema(this.dbClient, this.tableNames.sessions, getTableConfig(getSessionsTableSchema(this.tableNames)));

    if (error) {
      throw new Error(error);
    }

    return true;
  }

  override async checkOauthAccountTable() {
    const error = await validateDabaseWithSchema(this.dbClient, this.tableNames.oauthAccounts, getTableConfig(getOAuthAccountsTableSchema(this.tableNames)));

    if (error) {
      throw new Error(error);
    }

    return true;
  }
}
