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
import { EmailVerificationCodeExpiredError, EmailVerificationFailedError, InvalidEmailOrPasswordError, InvalidEmailToResetPasswordError, InvalidPasswordToResetError, InvalidUserIdToResetPasswordError, RateLimitAskEmailVerificationError, RateLimitAskResetPasswordError, RateLimitLoginError, RateLimitVerifyEmailVerificationError, RateLimitVerifyResetPasswordError, ResetPasswordTokenExpiredError } from "./errors/SlipAuthError.js";
import type { Database } from "db0";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";
import type { H3Event } from "h3";
import { SlipAuthRateLimiters } from "./rate-limit/SlipAuthRateLimiters";
import type { Storage } from "unstorage";

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

  #rateLimiters = new SlipAuthRateLimiters();

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

  public async login(h3Event: H3Event, values: ILoginUserParams): Promise<[ string, SlipAuthPublicSession]> {
    const email = values.email;
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      throw new InvalidEmailOrPasswordError("invalid email");
    }
    const password = values.password;
    if (!password || typeof password !== "string") {
      throw new InvalidEmailOrPasswordError("invalid password");
    }

    const existingUser = await this.#repos.users.findByEmail({ email });

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

    const [isNotRateLimited, rateLimitResult] = await this.#rateLimiters.login.check(existingUser.id);
    if (!isNotRateLimited) {
      throw new RateLimitLoginError({
        msBeforeNext: (rateLimitResult.updatedAt + rateLimitResult.timeout * 1000) - Date.now(),
      });
    }

    const validPassword = await this.#passwordHashingMethods.verify(existingUser.password, password);
    if (!validPassword) {
      await this.#rateLimiters.login.increment(existingUser.id);
      throw new InvalidEmailOrPasswordError("login invalid password");
    }

    await this.#rateLimiters.login.reset(existingUser.id);
    const sessionToLoginId = this.#createRandomSessionId();
    const sessionToLogin = await this.#repos.sessions.insert({
      id: sessionToLoginId,
      userId: existingUser.id,
      expiresAt: Date.now() + this.#sessionMaxAge,
      ip: values.ip,
      ua: values.ua,
    });

    return [existingUser.id, sessionToLogin];
  }

  public async register(h3Event: H3Event, values: ICreateUserParams): Promise<[ string, SlipAuthPublicSession]> {
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
      const user = await this.#repos.users.insert({
        id: userId,
        email,
        password: passwordHash,
      });
      await this.askEmailVerificationCode(h3Event, { user });
      const sessionToLoginId = this.#createRandomSessionId();
      const sessionToLogin = await this.#repos.sessions.insert({
        id: sessionToLoginId,
        userId: user.id,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: values.ip,
        ua: values.ua,
      });

      return [user.id, sessionToLogin];
    }
    catch (error) {
      if (error instanceof Error && error.stack?.includes(`UNIQUE constraint failed: ${this.#tableNames.users}.email`)) {
        throw new InvalidEmailOrPasswordError(`email already taken: ${values.email}`);
      }

      throw error;
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
    const existingUser = await this.#repos.users.findByEmail({ email: params.email });

    if (!existingUser) {
      const userId = this.#createRandomUserId();

      await this.#repos.users.insert({ id: userId, email: params.email });

      const _insertedOAuthAccount = await this.#repos.oAuthAccounts.insert({
        email: params.email,
        provider_id: params.providerId,
        provider_user_id: params.providerUserId,
        user_id: userId,
      });

      const sessionFromRegistrationId = this.#createRandomSessionId();
      const sessionFromRegistration = await this.#repos.sessions.insert({
        id: sessionFromRegistrationId,
        userId,
        expiresAt: Date.now() + this.#sessionMaxAge,
        ip: params.ip,
        ua: params.ua,
      });

      return [userId, sessionFromRegistration];
    }

    const existingAccount = await this.#repos.oAuthAccounts.findByProviderData({
      providerId: params.providerId,
      providerUserId: params.providerUserId,
    });

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      const sessionFromLoginId = this.#createRandomSessionId();
      const sessionFromLogin = await this.#repos.sessions.insert({
        id: sessionFromLoginId,
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

  /**
   * Make sure to set the Referrer Policy tag to strict-origin (or equivalent) for any path that includes tokens to protect the tokens from referer leakage.
   */
  public async askEmailVerificationCode(event: H3Event, { user }: { user: SlipAuthUser }): Promise<void> {
    // rate limit any function that leads to send email
    const [isNotRateLimited, rateLimitResult] = await this.#rateLimiters.askEmailVerification.check(user.id);
    if (!isNotRateLimited) {
      throw new RateLimitAskEmailVerificationError({
        msBeforeNext: (rateLimitResult.updatedAt + rateLimitResult.timeout * 1000) - Date.now(),
      });
    }

    await this.#rateLimiters.askEmailVerification.increment(user.id);
    await this.#repos.emailVerificationCodes.deleteAllByUserId(user.id);
    await this.#repos.emailVerificationCodes.insert({
      userId: user.id,
      email: user.email,
      code: this.#createRandomEmailVerificationCode(),
    });
    // send mail to user
  }

  // TODO: use transactions
  public async verifyEmailVerificationCode(h3Event: H3Event, params: { user: SlipAuthUser, code: string }): Promise<true> {
    // TODO add where clause with code
    // TODO add where clause with email ?
    const databaseCode = await this.#repos.emailVerificationCodes.findByUserId({ userId: params.user.id });
    if (!databaseCode || databaseCode.code !== params.code) {
      throw new EmailVerificationFailedError();
    }

    // rate limit any function that leads to send email
    const [isNotRateLimited, rateLimitResult] = await this.#rateLimiters.verifyEmailVerification.check(databaseCode.user_id);

    if (!isNotRateLimited) {
      throw new RateLimitVerifyEmailVerificationError({
        msBeforeNext: (rateLimitResult.updatedAt + rateLimitResult.timeout * 1000) - Date.now(),
      });
    }

    this.#repos.emailVerificationCodes.deleteById(databaseCode.id);
    const expirationDate = databaseCode.expires_at instanceof Date ? databaseCode.expires_at : new Date(databaseCode.expires_at);
    const offset = expirationDate.getTimezoneOffset() * 60000; // Get local time zone offset in milliseconds
    const localExpirationDate = new Date(expirationDate.getTime() - offset); // Adjust for local time zone

    if (!isWithinExpirationDate(localExpirationDate)) {
      await this.#rateLimiters.verifyEmailVerification.increment(databaseCode.user_id);
      throw new EmailVerificationCodeExpiredError();
    }

    if (databaseCode.email !== params.user.email) {
      await this.#rateLimiters.verifyEmailVerification.increment(databaseCode.user_id);
      throw new EmailVerificationFailedError();
    }

    await this.#repos.users.updateEmailVerifiedByUserId({ id: databaseCode.user_id, value: true });
    // TODO: All sessions should be invalidated when the email is verified (and create a new one for the current user so they stay signed in).
    return true;
  }

  /**
   * The token should be valid for at most few hours. The token should be hashed before storage as it essentially is a password.
   * SHA-256 can be used here since the token is long and random, unlike user passwords.
   */
  public async askPasswordReset(h3Event: H3Event, params: { userId: string }) {
    // rate limit any function that leads to send email
    // TODO: "Make sure to implement rate limiting based on IP addresses." https://lucia-auth.com/guides/email-and-password/password-reset#:~:text=Make%20sure%20to,Verify%20token
    const [isNotRateLimited, rateLimitResult] = await this.#rateLimiters.askResetPassword.check(params.userId);
    if (!isNotRateLimited) {
      throw new RateLimitAskResetPasswordError({
        msBeforeNext: (rateLimitResult.updatedAt + rateLimitResult.timeout * 1000) - Date.now(),
      });
    }

    await this.#rateLimiters.askResetPassword.increment(params.userId);
    // optionally invalidate all existing tokens
    // this.#repos.resetPasswordTokens.deleteAllByUserId(userId);
    const tokenId = defaultResetPasswordTokenIdMethod();
    const tokenHash = await this.#createResetPasswordTokenHashMethod(tokenId);
    try {
      await this.#repos.resetPasswordTokens.insert({
        token_hash: tokenHash,
        user_id: params.userId,
        expires_at: createDate(new TimeSpan(2, "h")),
      });

      return tokenId;
    }
    catch (error) {
      if (error instanceof Error && error.message.includes("FOREIGN KEY constraint failed")) {
        throw new InvalidUserIdToResetPasswordError();
      }

      throw error;
    }
  }

  public async askForgotPasswordReset(h3Event: H3Event, params: { emailAddress: string }): Promise<string> {
    const user = await this.#repos.users.findByEmail({ email: params.emailAddress });
    if (!user) {
      // If you want to avoid disclosing valid emails,
      // this can be a normal 200 response.
      throw new InvalidEmailToResetPasswordError();
    }
    return this.askPasswordReset(h3Event, { userId: user.id });
  }

  /**
   * Make sure to set the Referrer-Policy header of the password reset page to strict-origin to protect the token from referrer leakage.
   * WARNING: WILL UN-LOG THE USER
   */
  public async resetPasswordWithResetToken(h3Event: H3Event, params: { verificationToken: string, newPassword: string }): Promise<true> {
    if (typeof params.newPassword !== "string") {
      throw new InvalidPasswordToResetError();
    }

    const tokenHash = await this.#createResetPasswordTokenHashMethod(params.verificationToken);
    const token = await this.#repos.resetPasswordTokens.findByTokenHash({ tokenHash });

    if (!token) {
      throw new ResetPasswordTokenExpiredError();
    }

    if (token) {
      await this.#repos.resetPasswordTokens.deleteByTokenHash({ tokenHash });
    }

    // rate limit any function that leads to send email
    const [isNotRateLimited, rateLimitResult] = await this.#rateLimiters.verifyResetPassword.check(token.user_id);
    if (!isNotRateLimited) {
      throw new RateLimitVerifyResetPasswordError({
        msBeforeNext: (rateLimitResult.updatedAt + rateLimitResult.timeout * 1000) - Date.now(),
      });
    }

    await this.#rateLimiters.verifyResetPassword.increment(token.user_id);
    const expirationDate = token.expires_at instanceof Date ? token.expires_at : new Date(token.expires_at);
    const offset = expirationDate.getTimezoneOffset() * 60000; // Get local time zone offset in milliseconds
    const localExpirationDate = new Date(expirationDate.getTime() - offset); // Adjust for local time zone
    if (!isWithinExpirationDate(localExpirationDate)) {
      throw new ResetPasswordTokenExpiredError();
    }

    await this.#repos.sessions.deleteAllByUserId(token.user_id);
    const passwordHash = await this.#passwordHashingMethods.hash(params.newPassword);
    await this.#repos.users.updatePasswordByUserId({ id: token.user_id, password: passwordHash });

    // await this.#rateLimiters.verifyResetPassword.reset(token.user_id);
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

    setLoginRateLimiter: (fn: () => Storage) => {
      this.#rateLimiters.login.storage = fn();
    },
    setAskEmailRateLimiter: (fn: () => Storage) => {
      this.#rateLimiters.askEmailVerification.storage = fn();
    },
    setVerifyEmailRateLimiter: (fn: () => Storage) => {
      this.#rateLimiters.verifyEmailVerification.storage = fn();
    },
    setAskResetPasswordRateLimiter: (fn: () => Storage) => {
      this.#rateLimiters.askResetPassword.storage = fn();
    },
    setVerifyResetPasswordRateLimiter: (fn: () => Storage) => {
      this.#rateLimiters.verifyResetPassword.storage = fn();
    },
  };

  public getUser({ id }: { id: string }) {
    return this.#repos.users.findById({ id });
  }

  public getSession({ id }: { id: string }) {
    return this.#repos.sessions.findById({ id: id });
  }

  public deleteSession({ id }: { id: string }) {
    return this.#repos.sessions.deleteById({ id });
  }

  public deleteExpiredSessions({ timestamp }: { timestamp: number }) {
    return this.#repos.sessions.deleteExpired({ timestamp });
  }
}
