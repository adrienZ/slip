import { eq, sql } from "drizzle-orm";
import { TableRepository } from "./_repo";
import type { ICreateSessionsParams } from "../types";

export class SessionsRepository extends TableRepository<"sessions"> {
  async insert({ id, userId, expiresAt, ip, ua }: ICreateSessionsParams): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values({
        id: id,
        expires_at: expiresAt,
        user_id: userId,
        ip,
        ua,
      }).run();

    const sessionInserted = await this.findById({ id: id });
    if (!sessionInserted) {
      throw new Error(`Session ${id} not found after insert`);
    }

    this._hooks.callHookParallel("sessions:create", sessionInserted);

    return sessionInserted;
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

  async deleteExpired({ timestamp }: { timestamp: number }) {
    const sessionsToDelete = await this._orm.select().from(this.table).where(sql`${this.table.expires_at} < ${timestamp}`);

    await this._orm
      .delete(this.table)
      .where(sql`${this.table.expires_at} < ${timestamp}`);

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const expiredSessions = await this._orm.select().from(this.table).where(sql`${this.table.expires_at} < ${timestamp}`);
    return { success: this.getRawSQlResults(expiredSessions).length === 0, count: this.getRawSQlResults(sessionsToDelete).length };
  }

  async deleteAllByUserId(userId: string) {
    const sessionsToDelete = await this._orm.select().from(this.table).where(
      eq(this.table.user_id, userId),
    );

    await this._orm
      .delete(this.table)
      .where(
        eq(this.table.user_id, userId),
      );

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const deletedSessions = await this._orm.select().from(this.table).where(eq(this.table.user_id, userId));
    return { success: this.getRawSQlResults(deletedSessions).length === 0, count: this.getRawSQlResults(sessionsToDelete).length };
  }

  async deleteById({ id }: { id: string }) {
    const sessionToDelete = await this.findById({ id: id });

    if (!sessionToDelete) {
      throw new Error(`Unable to delete session with id ${id}`);
    }

    await this._orm
      .delete(this.table)
      .where(
        eq(this.table.id, id),
      )
      .run();

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const expiredSession = await this.findById({ id: id });

    if (expiredSession) {
      return { success: false };
    }

    this._hooks.callHookParallel("sessions:delete", sessionToDelete);

    return { succes: true };
  }
}
