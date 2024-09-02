import { eq, and } from "drizzle-orm";
import { TableRepository } from "./_repo";

export class OAuthAccountsRepository extends TableRepository<"oauthAccounts"> {
  async insert(email: string, values: typeof this.table.$inferInsert): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values(values)
      .run();

    const oAuthAccountInserted = await this.findByProviderData(values.provider_id, values.provider_user_id);
    if (!oAuthAccountInserted) {
      throw new Error(`oAuthAccount ${email} not found after insert`);
    }

    this._hooks.callHookParallel("oAuthAccount:create", oAuthAccountInserted);

    return oAuthAccountInserted;
  }

  async findByProviderData(providerId: string, providerUserId: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.provider_id, providerId),
          eq(this.table.provider_user_id, providerUserId),
        ));

    return rows.at(0);
  }
}
