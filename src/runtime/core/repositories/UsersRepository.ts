import { eq } from "drizzle-orm";
import { TableRepository } from "./_repo";

export class UsersRepository extends TableRepository<"users"> {
  async insert({ id, email, password }: { id: string, email: string, password?: string }): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values({
        id: id,
        email,
        password,
      }).run();

    const user = await this.findById({ id });
    if (!user) {
      throw new Error(`User ${id} not found after insert`);
    }

    this._hooks.callHookParallel("users:create", user);

    return user;
  }

  async findById({ id }: { id: string }): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.id, id),
      );
    const user = this.getRawSQlResults(rows).at(0);

    return user;
  }

  async findByEmail({ email }: { email: string }): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.email, email),
      );
    const user = this.getRawSQlResults(rows).at(0);

    return user;
  }

  updatePasswordByUserId = async ({ id, password }: { id: string, password: string }): Promise<void> => {
    return await this._orm
      .update(this.table)
      .set({
        password,
      })
      .where(eq(this.table.id, id))
      .run();
  };

  updateEmailVerifiedByUserId = async ({ id, value }: { id: string, value: boolean }): Promise<void> => {
    return await this._orm
      .update(this.table)
      .set({
        email_verified: value,
      })
      .where(eq(this.table.id, id))
      .run();
  };
}
