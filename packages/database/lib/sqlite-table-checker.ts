import { z } from "zod";
import { TableChecker } from "./table-checker";

const sqliteTableInfoRowSchema = z.object({
  cid: z.number(),
  name: z.string(),
  type: z.string(),
  notnull: z.number(),
  dflt_value: z.any(),
  pk: z.number()
});

// Define the main schema for the array
const UserTableSchema = z.array(sqliteTableInfoRowSchema).min(1).superRefine((arr, ctx) => {
  const idItem = arr.find(item => item.name === 'id');

  if (!idItem) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Array must contain an object with name "id"',
    });
  } else if (idItem.type !== 'TEXT') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'The object with name "id" must have type "TEXT"',
    });
  }
});

const SessionTableSchema = z.array(sqliteTableInfoRowSchema).min(1).superRefine((arr, ctx) => {
  const idItem = arr.find(item => item.name === 'id');

  if (!idItem) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Array must contain an object with name "id"',
    });
  } else if (idItem.type !== 'TEXT') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'The object with name "id" must have type "TEXT"',
    });
  }
});


export class SqliteTableChecker extends TableChecker {
  async checkUserTable(tableName: string) {
    const stmt = this.dbClient.prepare(`PRAGMA table_info(${tableName})`);
    const tableInfo = await stmt.all();
    UserTableSchema.parse(tableInfo);

    return await true
  }

  async checkSessionTable(tableName: string): Promise<boolean> {
    const stmt = this.dbClient.prepare(`PRAGMA table_info(${tableName})`);
    const tableInfo = await stmt.all();
    SessionTableSchema.parse(tableInfo);

    return await true
  }
}