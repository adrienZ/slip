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

const UserTableSchema = z
  .array(sqliteTableInfoRowSchema)
  .min(1, "users table for SLIP does not exist")
  // ID
  .refine((arr) => arr.some((item) => item.name === "id"), {
    message: 'users table must contain a column with name "id"',
  })
  .refine(
    (arr) => arr.some((item) => item.name === "id" && item.type === "TEXT"),
    {
      message: 'users table must contain a column "id" with type "TEXT"',
    },
  )
  .refine((arr) => arr.some((item) => item.name === "id" && item.pk === 1), {
    message: 'users table must contain a column "id" as primary key',
  })
  .refine(
    (arr) => arr.some((item) => item.name === "id" && item.notnull === 1),
    {
      message: 'users table must contain a column "id" not nullable',
    },
  )
  // EMAIL
  .refine((arr) => arr.some((item) => item.name === "email"), {
    message: 'users table must contain a column with name "email"',
  })
  .refine(
    (arr) => arr.some((item) => item.name === "email" && item.type === "TEXT"),
    {
      message: 'users table must contain a column "email" with type "TEXT"',
    },
  )
  .refine(
    (arr) => arr.some((item) => item.name === "email" && item.notnull === 1),
    {
      message: 'users table must contain a column "email" not nullable',
    },
  );

const SessionTableSchema = z
  .array(sqliteTableInfoRowSchema)
  .min(1, "sessions table for SLIP does not exist")
  // ID
  .refine((arr) => arr.some((item) => item.name === "id"), {
    message: 'sessions table must contain a column with name "id"',
  })
  .refine(
    (arr) => arr.some((item) => item.name === "id" && item.type === "TEXT"),
    {
      message: 'sessions table must contain a column "id" with type "TEXT"',
    },
  )
  .refine((arr) => arr.some((item) => item.name === "id" && item.pk === 1), {
    message: 'sessions table must contain a column "id" as primary key',
  })
  .refine(
    (arr) => arr.some((item) => item.name === "id" && item.notnull === 1),
    {
      message: 'sessions table must contain a column "id" not nullable',
    },
  )
  // EXPIRES_AT
  .refine((arr) => arr.some((item) => item.name === "expires_at"), {
    message: 'sessions table must contain a column with name "expires_at"',
  })
  .refine(
    (arr) =>
      arr.some((item) => item.name === "expires_at" && item.type === "INTEGER"),
    {
      message:
        'sessions table must contain a column "expires_at" with type "INTEGER"',
    },
  )
  .refine(
    (arr) =>
      arr.some((item) => item.name === "expires_at" && item.notnull === 1),
    {
      message: 'sessions table must contain a column "expires_at" not nullable',
    },
  )
  // USER ID
  // .refine((arr) => arr.some((item) => item.name === "user_id"), {
  //   message: 'sessions table must contain a column with name "user_id"',
  // })
  .refine(
    (arr) =>
      arr.some((item) => item.name === "user_id" && item.type === "TEXT"),
    {
      message:
        'sessions table must contain a column "user_id" with type "TEXT"',
    },
  )
  .refine(
    (arr) => arr.some((item) => item.name === "user_id" && item.notnull === 1),
    {
      message: 'sessions table must contain a column "user_id" not nullable',
    },
  );
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
        `foreign key "user_id" in ${tableName} table should target the the "id" column from the "user" table`,
      );
    }

    return success;
  }
}
