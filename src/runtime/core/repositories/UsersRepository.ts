import { eq } from "drizzle-orm";
import { TableRepository } from "./_repo";
import type { DrizzleTransaction } from "../types";

export class UsersRepository extends TableRepository<"users"> {
  async insert({ userId, email }: { userId: string, email: string }, trx?: DrizzleTransaction): Promise<typeof this.table.$inferSelect> {
    const orm = trx ?? this._orm;
    await orm
      .insert(this.table)
      .values({
        id: userId,
        email: email,
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
    const user = rows.at(0);

    return user;
  }

  async findByEmail(email: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.email, email),
      );
    const user = rows.at(0);

    return user;
  }
}
