import { checkDbAndTables, type tableNames } from "@slip/database";
import { randomUUID } from "uncrypto";

export type { tableNames };
export { supportedConnectors } from "@slip/database";

type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

interface ICreateOrLoginParams {
  providerId: string;
  providerUserId: string;
  // because our slip is based on unique emails
  email: string;
}

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0];
  #tableNames: tableNames;

  constructor(
    providedDatabase: checkDbAndTablesParameters[0],
    tableNames: tableNames,
  ) {
    this.#db = providedDatabase;
    this.#tableNames = tableNames;
  }

  #createUserId() {
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
  ): Promise<boolean> {
    const existingUser = await this.#db
      .prepare(
        `SELECT id FROM ${this.#tableNames.users} WHERE email = '${params.email}'`,
      )
      .get();

    if (!existingUser) {
      const userId = this.#createUserId();

      const { success: userInsertSuccess } = await this.#db
        .prepare(
          `INSERT INTO ${this.#tableNames.users} (id, email) VALUES ('${userId}', '${params.email}')`,
        )
        .run();

      const { success: oauthInsertSuccess } = await this.#db
        .prepare(
          `INSERT INTO ${this.#tableNames.oauthAccounts} (provider_id, provider_user_id, user_id) VALUES ('${params.providerId}', '${params.providerUserId}', '${userId}')`,
        )
        .run();
      return oauthInsertSuccess && userInsertSuccess;
    }

    const existingAccount = await this.#db
      .prepare(
        `SELECT * from ${this.#tableNames.oauthAccounts} WHERE provider_id = '${params.providerId}' AND provider_user_id = '${params.providerUserId}'`,
      )
      .get();

    if (existingUser && existingAccount?.provider_id !== params.providerId) {
      throw new Error("user already have an account with another provider");
    }

    if (existingAccount) {
      return false;
      // nuxt-auth-utils handle the login
    }

    throw new Error("could not find oauth user");
  }
}
