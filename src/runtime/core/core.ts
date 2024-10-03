import { createChecker, type supportedConnectors } from "drizzle-schema-checker";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema, getEmailVerificationCodesTableSchema, getPasswordResetTokensTableSchema } from "../database/sqlite/schema.sqlite";
import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";
import type { ICreateOrLoginParams, ICreateUserParams, ILoginUserParams, IPasswordHashingMethods, ISlipAuthCoreOptions, SchemasMockValue, SlipAuthUser, tableNames } from "./types";
import { createSlipHooks } from "./hooks";
import { UsersRepository } from "./repositories/UsersRepository";
import { SessionsRepository } from "./repositories/SessionsRepository";
import { OAuthAccountsRepository } from "./repositories/OAuthAccountsRepository";
import { EmailVerificationCodesRepository } from "./repositories/EmailVerificationCodesRepository";
import { ResetPasswordTokensRepository } from "./repositories/ResetPasswordTokensRepository";
import type { SlipAuthPublicSession } from "../types";
import { defaultIdGenerationMethod, isValidEmail, defaultEmailVerificationCodeGenerationMethod, defaultHashPasswordMethod, defaultVerifyPasswordMethod, defaultResetPasswordTokenIdMethod, defaultResetPasswordTokenHashMethod } from "./email-and-password-utils";
import { InvalidEmailOrPasswordError, InvalidEmailToResetPasswordError, InvalidPasswordToResetError, InvalidUserIdToResetPasswordError, ResetPasswordTokenExpiredError, UnhandledError } from "./errors/SlipAuthError.js";
import type { Database } from "db0";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";

export class SlipAuthCore {
  readonly #db: Database;
  readonly #orm: ReturnType<typeof drizzleIntegration>;
  readonly #tableNames: tableNames;
  readonly #sessionMaxAge: number;
  readonly #repos: {
    users: UsersRepository
    sessions: SessionsRepository
    oAuthAccounts: OAuthAccountsRepository
    emailVerificationCodes: EmailVerificationCodesRepository
    resetPasswordTokens: ResetPasswordTokensRepository
  };

  #createRandomUserId: () => string = defaultIdGenerationMethod;
  #createRandomSessionId: () => string = defaultIdGenerationMethod;
  #createRandomEmailVerificationCode: () => string = defaultEmailVerificationCodeGenerationMethod;
  #createResetPasswordTokenHashMethod: (tokenId: string) => Promise<string> = defaultResetPasswordTokenHashMethod;

  #passwordHashingMethods: IPasswordHashingMethods = {
    hash: defaultHashPasswordMethod,
    verify: defaultVerifyPasswordMethod,
  };

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
      emailVerificationCodes: getEmailVerificationCodesTableSchema(tableNames),
      resetPasswordTokens: getPasswordResetTokensTableSchema(tableNames),
    };

    this.#repos = {
      users: new UsersRepository(this.#orm, this.schemas, this.hooks, "users"),
      sessions: new SessionsRepository(this.#orm, this.schemas, this.hooks, "sessions"),
      oAuthAccounts: new OAuthAccountsRepository(this.#orm, this.schemas, this.hooks, "oauthAccounts"),
      emailVerificationCodes: new EmailVerificationCodesRepository(this.#orm, this.schemas, this.hooks, "emailVerificationCodes"),
      resetPasswordTokens: new ResetPasswordTokensRepository(this.#orm, this.schemas, this.hooks, "resetPasswordTokens"),
    };
  }

  public checkDbAndTables(dialect: supportedConnectors) {
    const checker = createChecker(this.#db, dialect);

    return Promise.all([
      checker.checkTableWithSchema(this.#tableNames.users, this.schemas.users),
      checker.checkTableWithSchema(this.#tableNames.sessions, this.schemas.sessions),
      checker.checkTableWithSchema(this.#tableNames.oauthAccounts, this.schemas.oauthAccounts),
      checker.checkTableWithSchema(this.#tableNames.emailVerificationCodes, this.schemas.emailVerificationCodes),
      checker.checkTableWithSchema(this.#tableNames.resetPasswordTokens, this.schemas.resetPasswordTokens),
    ]).then(results => results.every(Boolean));
  }

  public async login(values: ILoginUserParams): Promise<[ string, SlipAuthPublicSession]> {
    const email = values.email;
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new InvalidEmailOrPasswordError("invalid email");
    }
    const password = values.password;
    if (!password || typeof password !== "string") {
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

    const validPassword = await this.#passwordHashingMethods.verify(existingUser.password, password);
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
    if (!password || typeof password !== "string") {
      throw new InvalidEmailOrPasswordError("invalid password");
    }

    const userId = this.#createRandomUserId();
    const passwordHash = await this.#passwordHashingMethods.hash(password);

    try {
      const user = await this.#repos.users.insert(userId, email, passwordHash);
      this.askEmailVerificationCode(user);
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
        if (error.stack?.includes(`UNIQUE constraint failed: ${this.#tableNames.users}.email`)) {
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

  public async askEmailVerificationCode(user: SlipAuthUser): Promise<void> {
    await this.#repos.emailVerificationCodes.deleteAllByUserId(user.id);
    await this.#repos.emailVerificationCodes.insert(user.id, user.email, this.#createRandomEmailVerificationCode());
    // send mail to user
  }

  // TODO: use transactions
  // TODO: rate limit
  public async verifyEmailVerificationCode(user: SlipAuthUser, code: string): Promise<boolean> {
    const databaseCode = await this.#repos.emailVerificationCodes.findByUserId(user.id);
    if (!databaseCode || databaseCode.code !== code) {
      return false;
    }

    this.#repos.emailVerificationCodes.deleteById(databaseCode.id);

    const expirationDate = databaseCode.expires_at instanceof Date ? databaseCode.expires_at : new Date(databaseCode.expires_at);
    const offset = expirationDate.getTimezoneOffset() * 60000; // Get local time zone offset in milliseconds
    const localExpirationDate = new Date(expirationDate.getTime() - offset); // Adjust for local time zone

    if (!isWithinExpirationDate(localExpirationDate)) {
      return false;
    }
    if (databaseCode.email !== user.email) {
      return false;
    }

    await this.#repos.users.updateEmailVerifiedByUserId(databaseCode.user_id, true);
    // should recreate session if true
    return true;
  }

  /**
   * The token should be valid for at most few hours. The token should be hashed before storage as it essentially is a password.
   * SHA-256 can be used here since the token is long and random, unlike user passwords.
   */
  public async askPasswordReset(userId: string) {
    // optionally invalidate all existing tokens
    // this.#repos.resetPasswordTokens.deleteAllByUserId(userId);
    const tokenId = defaultResetPasswordTokenIdMethod();
    const tokenHash = await this.#createResetPasswordTokenHashMethod(tokenId);
    try {
      await this.#repos.resetPasswordTokens.insert({
        token_hash: tokenHash,
        user_id: userId,
        expires_at: createDate(new TimeSpan(2, "h")),
      });

      return tokenId;
    }
    catch (error) {
      if (error instanceof Error && error.message.includes("FOREIGN KEY constraint failed")) {
        throw new InvalidUserIdToResetPasswordError();
      }

      throw new UnhandledError();
    }
  }

  // TODO: rate limit
  public async askForgotPasswordReset(emailAddress: string): Promise<string> {
    const user = await this.#repos.users.findByEmail(emailAddress);
    if (!user) {
      // If you want to avoid disclosing valid emails,
      // this can be a normal 200 response.
      throw new InvalidEmailToResetPasswordError();
    }
    return this.askPasswordReset(user.id);
  }

  /**
   * Make sure to set the Referrer-Policy header of the password reset page to strict-origin to protect the token from referrer leakage.
   * WARNING: WILL UN-LOG THE USER
   */
  public async resetPasswordWithResetToken(verificationToken: string, newPassword: string): Promise<true> {
    if (typeof newPassword !== "string") {
      throw new InvalidPasswordToResetError();
    }

    const tokenHash = await this.#createResetPasswordTokenHashMethod(verificationToken);
    const token = await this.#repos.resetPasswordTokens.findByTokenHash(tokenHash);

    if (!token) {
      throw new ResetPasswordTokenExpiredError();
    }

    if (token) {
      await this.#repos.resetPasswordTokens.deleteByTokenHash(tokenHash);
    }

    const expirationDate = token.expires_at instanceof Date ? token.expires_at : new Date(token.expires_at);
    const offset = expirationDate.getTimezoneOffset() * 60000; // Get local time zone offset in milliseconds
    const localExpirationDate = new Date(expirationDate.getTime() - offset); // Adjust for local time zone
    if (!isWithinExpirationDate(localExpirationDate)) {
      throw new ResetPasswordTokenExpiredError();
    }

    await this.#repos.sessions.deleteAllByUserId(token.user_id);
    const passwordHash = await this.#passwordHashingMethods.hash(newPassword);
    await this.#repos.users.updatePasswordByUserId(token.user_id, passwordHash);

    return true;
  }

  public setters = {
    setCreateRandomUserId: (fn: () => string) => {
      this.#createRandomUserId = fn;
    },

    setCreateRandomSessionId: (fn: () => string) => {
      this.#createRandomSessionId = fn;
    },

    setCreateRandomEmailVerificationCode: (fn: () => string) => {
      this.#createRandomEmailVerificationCode = fn;
    },

    setCreateResetPasswordTokenHashMethod: (fn: (tokenId: string) => Promise<string>) => {
      this.#createResetPasswordTokenHashMethod = fn;
    },

    setPasswordHashingMethods: (fn: () => IPasswordHashingMethods) => {
      const methods = fn();
      this.#passwordHashingMethods = methods;
    },
  };

  public getUser(userId: string) {
    return this.#repos.users.findById(userId);
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
