import { generateRandomString, alphabet } from "oslo/crypto";
import { createChecker, supportedConnectors } from "drizzle-schema-checker";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";
import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";
import type { ICreateOrLoginParams, ICreateUserParams, ILoginUserParams, ISlipAuthCoreOptions, SchemasMockValue, tableNames } from "./types";
import { createSlipHooks } from "./hooks";
import { UsersRepository } from "./repositories/UsersRepository";
import { SessionsRepository } from "./repositories/SessionsRepository";
import { OAuthAccountsRepository } from "./repositories/OAuthAccountsRepository";
import type { SlipAuthPublicSession } from "../types";
import { isValidEmail } from "./validators";
import { hashPassword, verifyPassword } from "./password";
import { InvalidEmailOrPasswordError, UnhandledError } from "./errors/SlipAuthError.js";
import type { Database } from "db0";

const defaultIdGenerationMethod = () => generateRandomString(15, alphabet("a-z", "A-Z", "0-9"));

export class SlipAuthCore {
  readonly #db: Database;
  readonly #orm: ReturnType<typeof drizzleIntegration>;
  readonly #tableNames: tableNames;
  readonly #sessionMaxAge: number;
  readonly #repos: {
    users: UsersRepository
    sessions: SessionsRepository
    oAuthAccounts: OAuthAccountsRepository
  };

  #createRandomUserId: () => string;
  #createRandomSessionId: () => string;

  readonly schemas: SchemasMockValue;
  readonly hooks = createSlipHooks();

  constructor(
    providedDatabase: Database,
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

    this.#createRandomSessionId = defaultIdGenerationMethod;
    this.#createRandomUserId = defaultIdGenerationMethod;
  }

  public checkDbAndTables(dialect: supportedConnectors) {
    const checker = createChecker(this.#db, dialect);

    return Promise.all([
      checker.checkTableWithSchema(this.#tableNames.users, this.schemas.users),
      checker.checkTableWithSchema(this.#tableNames.sessions, this.schemas.sessions),
      checker.checkTableWithSchema(this.#tableNames.oauthAccounts, this.schemas.oauthAccounts),
    ]);
  }

  public async login(values: ILoginUserParams): Promise<[ string, SlipAuthPublicSession]> {
    const email = values.email;
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new InvalidEmailOrPasswordError("invalid email");
    }
    const password = values.password;
    if (!password || typeof password !== "string" || password.length < 6) {
      throw new InvalidEmailOrPasswordError("invalid password");
    }

    const existingUser = await this.#repos.users.findByEmail(email);

    if (!existingUser) {
      // NOTE:
      // Returning immediately allows malicious actors to figure out valid emails from response times,
      // allowing them to only focus on guessing passwords in brute-force attacks.
      // As a preventive measure, you may want to hash passwords even for invalid emails.
      // However, valid emails can be already be revealed with the signup page
      // and a similar timing issue can likely be found in password reset implementation.
      // It will also be much more resource intensive.
      // Since protecting against this is non-trivial,
      // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
      // If emails/usernames are public, you may outright tell the user that the username is invalid.
      throw new InvalidEmailOrPasswordError("login no user with this email");
    }

    if (!existingUser.password) {
      throw new InvalidEmailOrPasswordError("no password oauth user");
    }

    const validPassword = await verifyPassword(existingUser.password, password);
    if (!validPassword) {
      throw new InvalidEmailOrPasswordError("login invalid password");
    }
    const sessionToLoginId = this.#createRandomSessionId();
    const sessionToLogin = await this.#repos.sessions.insert(sessionToLoginId, {
      userId: existingUser.id,
      expiresAt: Date.now() + this.#sessionMaxAge,
      ip: values.ip,
      ua: values.ua,
    });

    return [existingUser.id, sessionToLogin];
  }

  public async register(values: ICreateUserParams): Promise<[ string, SlipAuthPublicSession]> {
    const email = values.email;
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new InvalidEmailOrPasswordError("invalid email");
    }
    const password = values.password;
    if (!password || typeof password !== "string" || password.length < 6) {
      throw new InvalidEmailOrPasswordError("invalid password");
    }

    const userId = this.#createRandomUserId();
    const passwordHash = await hashPassword(password);

    try {
      const user = await this.#repos.users.insert(userId, email, passwordHash);
      const sessionToLoginId = this.#createRandomSessionId();
      const sessionToLogin = await this.#repos.sessions.insert(sessionToLoginId, {
        userId: user.id,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: values.ip,
        ua: values.ua,
      });

      return [user.id, sessionToLogin];
    }
    catch (error) {
      if (error instanceof Error) {
        if (error.stack?.startsWith(`SqliteError: UNIQUE constraint failed: ${this.#tableNames.users}.email`)) {
          throw new InvalidEmailOrPasswordError(`email already taken: ${values.email}`);
        }
        throw new UnhandledError();
      }

      throw new UnhandledError();
    }
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
  public async OAuthLoginUser(
    params: ICreateOrLoginParams,
  ): Promise<[ string, SlipAuthPublicSession]> {
    const existingUser = await this.#repos.users.findByEmail(params.email);

    if (!existingUser) {
      const userId = this.#createRandomUserId();

      await this.#repos.users.insert(userId, params.email);

      const _insertedOAuthAccount = await this.#repos.oAuthAccounts.insert(params.email, {
        provider_id: params.providerId,
        provider_user_id: params.providerUserId,
        user_id: userId,
      });

      const sessionFromRegistrationId = this.#createRandomSessionId();
      const sessionFromRegistration = await this.#repos.sessions.insert(sessionFromRegistrationId, {
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: params.ip,
        ua: params.ua,
      });

      return [userId, sessionFromRegistration];
    }

    const existingAccount = await this.#repos.oAuthAccounts.findByProviderData(
      params.providerId, params.providerUserId,
    );

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      const sessionFromLoginId = this.#createRandomSessionId();
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

  public setCreateRandomUserId(fn: () => string) {
    this.#createRandomUserId = fn;
  }

  public setCreateRandomSessionId(fn: () => string) {
    this.#createRandomSessionId = fn;
  }

  public getSession(sessionId: string) {
    return this.#repos.sessions.findById(sessionId);
  }

  public deleteSession(sessionId: string) {
    return this.#repos.sessions.deleteById(sessionId);
  }

  public deleteExpiredSessions(timestamp: number) {
    return this.#repos.sessions.deleteExpired(timestamp);
  }
}
