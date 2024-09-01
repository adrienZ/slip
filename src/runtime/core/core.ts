import { randomUUID } from "uncrypto";
import { checkDbAndTables, type tableNames } from "../database";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { eq, and } from "drizzle-orm";
import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";

export type { tableNames };
export type { supportedConnectors } from "../database";

type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

interface ICreateOrLoginParams {
  providerId: string
  providerUserId: string
  // because our slip is based on unique emails
  email: string
}

interface ICreateSessionsParams {
  userId: string
  expiresAt: number
}

type SessionsTableSelect = ReturnType<typeof getSessionsTableSchema>["$inferSelect"];
export interface SlipAuthSession extends Pick<SessionsTableSelect, "id" | "expires_at"> {

}

type UsersTableSelect = ReturnType<typeof getUsersTableSchema>["$inferSelect"];
export interface SlipAuthUser extends UsersTableSelect {
  id: string
}

type OAuthAccountsTableSelect = ReturnType<typeof getOAuthAccountsTableSchema>["$inferSelect"];
export interface SlipAuthOauthAccount extends OAuthAccountsTableSelect {
  provider_id: string
  provider_user_id: string
  user_id: string
}
// #endregion

interface ISlipAuthCoreOptions {
  sessionMaxAge: number
}
// #region schemas typings
const fakeTableNames: tableNames = {
  users: "fakeUsers",
  sessions: "fakeSessions",
  oauthAccounts: "fakeOauthAccounts",
};

const schemasMockValue = {
  users: getUsersTableSchema(fakeTableNames),
  sessions: getSessionsTableSchema(fakeTableNames),
  oauthAccounts: getOAuthAccountsTableSchema(fakeTableNames),
} satisfies Record<keyof tableNames, SQLiteTable>;
// #endregion

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0];
  #orm: ReturnType<typeof drizzleIntegration>;
  #tableNames: tableNames;
  #sessionMaxAge: number;
  schemas: typeof schemasMockValue;

  constructor(
    providedDatabase: checkDbAndTablesParameters[0],
    tableNames: tableNames,
    options: ISlipAuthCoreOptions,
  ) {
    this.#db = providedDatabase;
    this.#orm = drizzleIntegration(this.#db);
    this.#tableNames = tableNames;
    // in seconds
    this.#sessionMaxAge = options.sessionMaxAge * 1000;

    this.schemas = {
      users: getUsersTableSchema(tableNames),
      sessions: getSessionsTableSchema(tableNames),
      oauthAccounts: getOAuthAccountsTableSchema(tableNames),
    };
  }

  #createUserId() {
    return randomUUID();
  }

  #createSessionId() {
    return randomUUID();
  }

  public async checkDbAndTables(dialect: checkDbAndTablesParameters[1]) {
    return checkDbAndTables(this.#db, dialect, this.#tableNames);
  }

  /**
   * Registers a user in the database only if they are missing.
   * @param {ICreateOrLoginParams} params - The parameters for creating or logging in a user.
   * @returns {Promise<boolean>} Returns true if the user was registered, otherwise false (login or insert error).
   * @throws {Error} - Throws an error if email or user ID is missing when creating a user.
   */
  public async registerUserIfMissingInDb(
    params: ICreateOrLoginParams,
  ): Promise<SlipAuthSession> {
    const existingUser = (await this.#orm.select({
      id: this.schemas.users.id,
    })
      .from(this.schemas.users)
      .where(eq(this.schemas.users.email, params.email)))
      .at(0);

    if (!existingUser) {
      const userId = this.#createUserId();

      await this.#orm.insert(this.schemas.users)
        .values({
          id: userId,
          email: params.email,
        }).run();

      const { success: _oauthInsertSuccess } = await this.#orm.insert(this.schemas.oauthAccounts)
        .values({
          provider_id: params.providerId,
          provider_user_id: params.providerUserId,
          user_id: userId,
        }).run();

      const sessionFromRegistration = (await this.insertSession({
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
      })).at(0);

      return sessionFromRegistration as SlipAuthSession;
    }

    const existingAccount = (await this.#orm.select().from(this.schemas.oauthAccounts)
      .where(and(
        eq(this.schemas.oauthAccounts.provider_id, params.providerId),
        eq(this.schemas.oauthAccounts.provider_user_id, params.providerUserId),
      ))).at(0);

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      const sessionFromRegistration = await this.insertSession({
        userId: existingUser.id,
        expiresAt: Date.now() + this.#sessionMaxAge,
      });
      const { id, expires_at } = sessionFromRegistration[0];
      return { id, expires_at };
    }

    throw new Error("could not find oauth user");
  }

  public async insertSession({ userId, expiresAt }: ICreateSessionsParams) {
    const sessionId = this.#createSessionId();
    await this.#orm.insert(this.schemas.sessions)
      .values({
        id: sessionId,
        expires_at: expiresAt,
        user_id: userId,
      }).run();

    const session = await this.#orm.select().from(this.schemas.sessions).where(
      eq(this.schemas.sessions.id, sessionId),
    );

    return session;
  }

  public getSession(sessionId: string) {
    const query = this.#orm
      .select()
      .from(this.schemas.sessions)
      .where(
        eq(this.schemas.sessions.id, sessionId),
      );

    return query.then(res => res.at(0));
  }

  public async deleteSession(sessionId: string) {
    const { success } = await this.#db
      .prepare(
        `DELETE from ${this.#tableNames.sessions} WHERE id = '${sessionId}' LIMIT 1`,
      )
      .run();

    return success;
  }
}
