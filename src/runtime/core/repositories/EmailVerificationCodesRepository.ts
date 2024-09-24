import { eq, sql } from "drizzle-orm";
import { TableRepository } from "./_repo";
import { TimeSpan, createDate } from "oslo";

export class EmailVerificationCodesRepository extends TableRepository<"emailVerificationCodes"> {
  async insert(userId: string, email: string, code: string): Promise<void> {
    const values: typeof this.table.$inferInsert = {
      user_id: userId,
      email,
      code,
      // 15 minutes
      expires_at: createDate(new TimeSpan(15, "m")),
    };

    await this._orm
      .insert(this.table)
      .values(values)
      .run();

    this._hooks.callHookParallel("emailVerificationCode:create", values);
  }

  async findById(id: number): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select({
        id: this.table.id,
        email: this.table.email,
        user_id: this.table.user_id,
        code: this.table.code,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
        expires_at: sql<Date>`datetime(${this.table.expires_at}, 'unixepoch')`.as(this.table.expires_at.name),
      })
      .from(this.table)
      .where(
        eq(this.table.id, id),
      );

    const code = rows.at(0);

    return code;
  }

  async findByUserId(userId: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select({
        id: this.table.id,
        email: this.table.email,
        user_id: this.table.user_id,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
        expires_at: sql<Date>`datetime(${this.table.expires_at}, 'unixepoch')`.as(this.table.expires_at.name),
        code: this.table.code,
      })
      .from(this.table)
      .where(
        eq(this.table.user_id, userId),
      );

    const code = rows.at(0);

    return code;
  }

  async deleteById(codeId: number) {
    const codeToDelete = await this.findById(codeId);

    if (!codeToDelete) {
      throw new Error(`Unable to delete email verification code with id ${codeId}`);
    }

    await this._orm
      .delete(this.table)
      .where(
        eq(this.table.id, codeId),
      )
      .run();

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const deletedCode = await this.findById(codeId);

    if (deletedCode) {
      return { success: false };
    }

    this._hooks.callHookParallel("emailVerificationCode:delete", codeToDelete);

    return { succes: true };
  }
}
