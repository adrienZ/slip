import { generateRandomString, alphabet } from "oslo/crypto";
import { checkDbAndTables, type tableNames } from "../database";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { eq, and } from "drizzle-orm";
import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";
import type { checkDbAndTablesParameters, ICreateOrLoginParams, ICreateSessionsParams, ISlipAuthCoreOptions, SlipAuthSession } from "./types";
import { createSlipHooks } from "./hooks";

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

const defaultIdGenerationMethod = () => generateRandomString(15, alphabet("a-z", "A-Z", "0-9"));

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0];
  #orm: ReturnType<typeof drizzleIntegration>;
  #tableNames: tableNames;
  #sessionMaxAge: number;
  schemas: typeof schemasMockValue;

  hooks = createSlipHooks();

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

  // public to allow override
  public createRandomUserId() {
    return defaultIdGenerationMethod();
  }

  // public to allow override
  public createRandomSessionId() {
    return defaultIdGenerationMethod();
  }

  public async checkDbAndTables(dialect: checkDbAndTablesParameters[1]) {
    return checkDbAndTables(this.#db, dialect, this.#tableNames);
  }

  /**
   * Registers a user in the database only if they are missing.
   * @param {ICreateOrLoginParams} params - The parameters for creating or logging in a user.
   * @returns {Promise<boolean>} Returns true if the user was registered, otherwise false (login or insert error).
   * @throws {Error} - Throws an error if email or user ID is missing when creating a user.
   *
   * {@link https://v2.lucia-auth.com/guidebook/oauth-account-linking/}
   * {@link https://thecopenhagenbook.com/oauth#account-linking}
   */
  public async registerUserIfMissingInDb(
    params: ICreateOrLoginParams,
  ): Promise<[ string, SlipAuthSession]> {
    const existingUser = (await this.#orm.select({
      id: this.schemas.users.id,
    })
      .from(this.schemas.users)
      .where(eq(this.schemas.users.email, params.email)))
      .at(0);

    if (!existingUser) {
      const userId = this.createRandomUserId();

      await this.#orm.insert(this.schemas.users)
        .values({
          id: userId,
          email: params.email,
        }).run();

      const createdUser = (await this.#orm.select().from(this.schemas.users).where(eq(this.schemas.users.id, userId)))[0];

      const { success: _oauthInsertSuccess } = await this.#orm.insert(this.schemas.oauthAccounts)
        .values({
          provider_id: params.providerId,
          provider_user_id: params.providerUserId,
          user_id: userId,
        }).run();

      const sessionFromRegistration = (await this.insertSession({
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: params.ip,
        ua: params.ua,
      })).at(0);

      this.hooks.callHookParallel("users:create", createdUser);
      this.hooks.callHookParallel("sessions:create", sessionFromRegistration as SlipAuthSession);
      return [userId, sessionFromRegistration as SlipAuthSession];
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
        ua: params.ua,
        ip: params.ip,
      });
      const { id, expires_at } = sessionFromRegistration[0];

      this.hooks.callHookParallel("sessions:create", sessionFromRegistration[0]);
      return [existingUser.id, { id, expires_at }];
    }

    throw new Error("could not find oauth user");
  }

  public async insertSession({ userId, expiresAt, ip, ua }: ICreateSessionsParams) {
    const sessionId = this.createRandomSessionId();
    await this.#orm.insert(this.schemas.sessions)
      .values({
        id: sessionId,
        expires_at: expiresAt,
        user_id: userId,
        ip,
        ua,
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
