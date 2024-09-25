import { eq } from "drizzle-orm";
import { TableRepository } from "./_repo";

export class UsersRepository extends TableRepository<"users"> {
  async insert(userId: string, email: string, password?: string): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values({
        id: userId,
        email,
        password,
      }).run();

    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found after insert`);
    }

    this._hooks.callHookParallel("users:create", user);

    return user;
  }

  async findById(userId: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.id, userId),
      );
    const user = this.getRawSQlResults(rows).at(0);

    return user;
  }

  async findByEmail(email: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.email, email),
      );
    const user = this.getRawSQlResults(rows).at(0);

    return user;
  }
}
