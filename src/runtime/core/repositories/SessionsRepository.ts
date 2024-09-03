import { eq, sql } from "drizzle-orm";
import { TableRepository } from "./_repo";
import type { ICreateSessionsParams } from "../types";

export class SessionsRepository extends TableRepository<"sessions"> {
  async insert(sessionId: string, { userId, expiresAt, ip, ua }: ICreateSessionsParams): Promise<typeof this.table.$inferSelect> {
    await this._orm
      .insert(this.table)
      .values({
        id: sessionId,
        expires_at: expiresAt,
        user_id: userId,
        ip,
        ua,
      }).run();

    const sessionInserted = await this.findById(sessionId);
    if (!sessionInserted) {
      throw new Error(`Session ${sessionId} not found after insert`);
    }

    this._hooks.callHookParallel("sessions:create", sessionInserted);

    return sessionInserted;
  }

  async findById(sessionId: string): Promise<typeof this.table.$inferSelect | undefined> {
    const rows = await this._orm
      .select()
      .from(this.table)
      .where(
        eq(this.table.id, sessionId),
      );
    const user = rows.at(0);

    return user;
  }

  async deleteExpired(timestamp: number = new Date("2026-01-01").getTime()) {
    const sessionsToDelete = await this._orm.select().from(this.table).where(sql`${this.table.expires_at} < ${timestamp}`);

    await this._orm
      .delete(this.table)
      .where(sql`${this.table.expires_at} < ${timestamp}`);

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const expiredSessions = await this._orm.select().from(this.table).where(sql`${this.table.expires_at} < ${timestamp}`);
    return { success: expiredSessions.length === 0, count: sessionsToDelete.length };
  }

  async deleteById(sessionId: string) {
    const sessionToDelete = await this.findById(sessionId);

    if (!sessionToDelete) {
      throw new Error(`Unable to delete session with id ${sessionId}`);
    }

    await this._orm
      .delete(this.table)
      .where(
        eq(this.table.id, sessionId),
      )
      .run();

    // TODO: fix typings in db0 / drizzle
    // as the delete from drizzle returns any we do an extra query to check if the deletion went fine
    const expiredSession = await this.findById(sessionId);

    if (expiredSession) {
      return { success: false };
    }

    this._hooks.callHookParallel("sessions:delete", sessionToDelete);

    return { succes: true };
  }
}
