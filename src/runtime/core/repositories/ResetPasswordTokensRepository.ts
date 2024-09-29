import { eq, sql } from "drizzle-orm";
import { TableRepository } from "./_repo";

export class ResetPasswordTokensRepository extends TableRepository<"resetPasswordTokens"> {
  async insert({ expires_at, token_hash, user_id }: typeof this.table.$inferInsert): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values({
        expires_at, token_hash, user_id,
      }).run();

    const tokenInserted = await this.findByTokenHash(token_hash);
    if (!tokenInserted) {
      throw new Error(`Reset password token ${token_hash} not found after insert`);
    }

    this._hooks.callHookParallel("resetPasswordToken:create", tokenInserted);

    return tokenInserted;
  }

  async findByTokenHash(tokenHash: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select({
        token_hash: this.table.token_hash,
        user_id: this.table.user_id,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
        expires_at: sql<Date>`datetime(${this.table.expires_at}, 'unixepoch')`.as(this.table.expires_at.name),
      })
      .from(this.table)
      .where(
        eq(this.table.token_hash, tokenHash),
      );
    const token = this.getRawSQlResults(rows).at(0);

    return token;
  }

  async findByAllByUserId(userId: string): Promise<typeof this.table.$inferSelect[]> {
    const rows = await this._orm
      .select({
        token_hash: this.table.token_hash,
        user_id: this.table.user_id,
        created_at: this.table.created_at,
        updated_at: this.table.updated_at,
        expires_at: sql<Date>`datetime(${this.table.expires_at}, 'unixepoch')`.as(this.table.expires_at.name),
      })
      .from(this.table)
      .where(
        eq(this.table.user_id, userId),
      );
    const tokens = this.getRawSQlResults(rows);

    return tokens;
  }

  async deleteByTokenHash(tokenHash: string) {
    const tokenToDelete = await this.findByTokenHash(tokenHash);

    if (!tokenToDelete) {
      throw new Error(`Unable to delete session with id ${tokenHash}`);
    }

    await this._orm
      .delete(this.table)
      .where(
        eq(this.table.token_hash, tokenHash),
      )
      .run();

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const validatedToken = await this.findByTokenHash(tokenHash);

    if (validatedToken) {
      return { success: false };
    }

    this._hooks.callHookParallel("resetPasswordToken:delete", tokenToDelete);

    return { succes: true };
  }
}
