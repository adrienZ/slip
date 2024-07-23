import { checkDbAndTables, type tableNames } from "@slip/database";
// import { hash } from "@node-rs/argon2";

type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

export class SlipAuthCore {
  #db: checkDbAndTablesParameters[0]
  #tableNames: tableNames
  // #PASSWORD_SALT = "SLIP_SRKWkJH.}!JgT0;6MgaN?R=bTCKg*:_"

  constructor(
    providedDatase: checkDbAndTablesParameters[0],
    dialect: checkDbAndTablesParameters[1],
    tableNames: tableNames
  ) {
    checkDbAndTables(providedDatase, dialect, tableNames);

    this.#db = providedDatase;
    this.#tableNames = tableNames;
  }


  // private hasPassword(password: string) {
  //   return hash(this.PASSWORD_SALT + password);
  // }

  async registerUser(id: string, email: string) {
    const insterted = await  this.#db.prepare(`INSERT INTO ${this.#tableNames.users} (id, email) VALUES ('${id}', '${email}')`).run()
    const users = await this.#db.prepare(`SELECT * FROM ${this.#tableNames.users} WHERE id = '${id}'`).all();
    return users[0];
  }


  async loginUser(email: string) {
    const rows = await this.#db.prepare(`SELECT * FROM ${this.#tableNames.users} WHERE email = '${email}'`).all()
    const user = rows.at(1);

    if (!user) {
			return createError({
				statusCode: 401,
				statusMessage: "Invalid username or password",
			});
		}

    return user;
  }
}
