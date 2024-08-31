import { randomUUID } from "uncrypto";
import { checkDbAndTables, type tableNames } from "@/src/database";
import type { getSessionsTableSchema, getUsersTableSchema, getOAuthAccountsTableSchema } from "@/src/database/lib/schema";

export type { tableNames };
export type { supportedConnectors } from "@/src/database";

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
export interface SlipAuthSession extends SessionsTableSelect {

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

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0];
  #tableNames: tableNames;

  #sessionMaxAge: number;

  constructor(
    providedDatabase: checkDbAndTablesParameters[0],
    tableNames: tableNames,
    options: ISlipAuthCoreOptions,
  ) {
    this.#db = providedDatabase;
    this.#tableNames = tableNames;
    // in seconds
    this.#sessionMaxAge = options.sessionMaxAge * 1000;
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
    const existingUser = (await this.#db
      .prepare(
        `SELECT id FROM ${this.#tableNames.users} WHERE email = '${params.email}'`,
      )
      .get()) as SlipAuthUser;

    if (!existingUser) {
      const userId = this.#createUserId();

      await this.#db
        .prepare(
          `INSERT INTO ${this.#tableNames.users} (id, email) VALUES ('${userId}', '${params.email}')`,
        )
        .run();

      const { success: _oauthInsertSuccess } = await this.#db
        .prepare(
          `INSERT INTO ${this.#tableNames.oauthAccounts} (provider_id, provider_user_id, user_id) VALUES ('${params.providerId}', '${params.providerUserId}', '${userId}')`,
        )
        .run();

      const sessionFromRegistration = await this.insertSession({
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
      });

      return sessionFromRegistration as SlipAuthSession;
    }

    const existingAccount = (await this.#db
      .prepare(
        `SELECT * from ${this.#tableNames.oauthAccounts} WHERE provider_id = '${params.providerId}' AND provider_user_id = '${params.providerUserId}'`,
      )
      .get()) as SlipAuthOauthAccount;

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      const sessionFromRegistration = await this.insertSession({
        userId: existingUser.id,
        expiresAt: Date.now() + this.#sessionMaxAge,
      });
      return sessionFromRegistration as SlipAuthSession;
    }

    throw new Error("could not find oauth user");
  }

  public async insertSession({ userId, expiresAt }: ICreateSessionsParams) {
    const sessionId = this.#createSessionId();
    await this.#db
      .prepare(
        `INSERT INTO ${this.#tableNames.sessions} (id, expires_at, user_id) VALUES ('${sessionId}', '${expiresAt}', '${userId}')`,
      )
      .run();

    const session = this.#db
      .prepare(
        `SELECT * from ${this.#tableNames.sessions} WHERE id = '${sessionId}'`,
      )
      .get();

    return session;
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
