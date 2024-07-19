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
const UserTableSchema = z
  .array(sqliteTableInfoRowSchema)
  .min(1, "users table for SLIP does not exist")
  // ID
  .refine(arr => arr.some(item => item.name === 'id'), {
    message: 'users table must contain a column with name "id"'
  })
  .refine(arr => arr.some(item => item.name === 'id' && item.type === 'TEXT'), {
    message: 'users table must contain a column "id" with type "TEXT"',
  })
  .refine(arr => arr.some(item => item.name === 'id' && item.pk === 1), {
    message: 'users table must contain a column "id" as primary key',
  })
  // EMAIL
  .refine(arr => arr.some(item => item.name === 'email'), {
    message: 'users table must contain a column with name "email"'
  })
  .refine(arr => arr.some(item => item.name === 'email' && item.type === 'TEXT'), {
    message: 'users table must contain a column "email" with type "TEXT"',
  })
  .refine(arr => arr.some(item => item.name === 'email' && item.notnull === 1), {
    message: 'users table must contain a column "email" non nullable',
  });

export class SqliteTableChecker extends TableChecker {
  async checkUserTable(tableName: string) {
    const tableInfo = await this.dbClient.prepare(`PRAGMA table_info(${tableName})`).all();
    const { success, error } = UserTableSchema.safeParse(tableInfo);

    if (!success) {
      throw new Error(error.errors[0].message);
    }

    return success
  }
}