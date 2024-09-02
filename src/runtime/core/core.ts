import { generateRandomString, alphabet } from "oslo/crypto";
import { checkDbAndTables, type tableNames } from "../database";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";
import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";
import type { checkDbAndTablesParameters, ICreateOrLoginParams, ISlipAuthCoreOptions, SchemasMockValue, SlipAuthSession } from "./types";
import { createSlipHooks } from "./hooks";
import { UsersRepository } from "./repositories/UsersRepository";
import { SessionsRepository } from "./repositories/SessionsRepository";
import { OAuthAccountsRepository } from "./repositories/OAuthAccountsRepository";

const defaultIdGenerationMethod = () => generateRandomString(15, alphabet("a-z", "A-Z", "0-9"));

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0];
  #orm: ReturnType<typeof drizzleIntegration>;
  #tableNames: tableNames;
  #sessionMaxAge: number;
  #repos: {
    users: UsersRepository
    sessions: SessionsRepository
    oAuthAccounts: OAuthAccountsRepository
  };

  schemas: SchemasMockValue;

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

    this.#repos = {
      users: new UsersRepository(this.#orm, this.schemas, this.hooks, "users"),
      sessions: new SessionsRepository(this.#orm, this.schemas, this.hooks, "sessions"),
      oAuthAccounts: new OAuthAccountsRepository(this.#orm, this.schemas, this.hooks, "oauthAccounts"),
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
    const existingUser = await this.#repos.users.findByEmail(params.email);

    if (!existingUser) {
      const userId = this.createRandomUserId();

      await this.#repos.users.insert(userId, params.email);

      const _insertedOAuthAccount = await this.#repos.oAuthAccounts.insert(params.email, {
        provider_id: params.providerId,
        provider_user_id: params.providerUserId,
        user_id: userId,
      });

      const sessionFromRegistrationId = this.createRandomSessionId();
      const sessionFromRegistration = await this.#repos.sessions.insert(sessionFromRegistrationId, {
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: params.ip,
        ua: params.ua,
      });

      return [userId, sessionFromRegistration as SlipAuthSession];
    }

    const existingAccount = await this.#repos.oAuthAccounts.findByProviderData(
      params.providerId, params.providerUserId,
    );

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      const sessionFromLoginId = this.createRandomSessionId();
      const sessionFromLogin = await this.#repos.sessions.insert(sessionFromLoginId, {
        userId: existingUser.id,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ua: params.ua,
        ip: params.ip,
      });
      const { id, expires_at } = sessionFromLogin;

      return [existingUser.id, { id, expires_at }];
    }

    throw new Error("could not find oauth user");
  }

  public getSession(sessionId: string) {
    return this.#repos.sessions.findById(sessionId);
  }

  public async deleteSession(sessionId: string) {
    return this.#repos.sessions.deleteById(sessionId);
  }
}
