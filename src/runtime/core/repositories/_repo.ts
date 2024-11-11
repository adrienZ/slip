import type { drizzle as drizzleIntegration } from "db0/integrations/drizzle";
import type { SchemasMockValue } from "../types";
import type { ISlipAuthHooks } from "../hooks";

export class TableRepository<T extends keyof SchemasMockValue> {
  protected _schemas: SchemasMockValue;
  protected _orm: ReturnType<typeof drizzleIntegration>;
  protected _hooks: ISlipAuthHooks;
  table: SchemasMockValue[T];

  constructor(orm: ReturnType<typeof drizzleIntegration>, schemas: SchemasMockValue, hooks: ISlipAuthHooks, name: T) {
    this._schemas = schemas;
    this._orm = orm;
    this._hooks = hooks;
    this.table = this._schemas[name];
  }

  isSqliteD1<T extends Array<unknown>>(sqlResult: T | { results: T, success: true, meta: object }): sqlResult is { results: T, success: true, meta: object } {
    if (Array.isArray(sqlResult)) {
      return false;
    }

    if (
      sqlResult.success === true
      && typeof sqlResult.meta === "object"
      && Array.isArray(sqlResult.results)
    ) {
      return true;
    }

    return false;
  }

  getRawSQlResults<T extends Array<unknown>>(sqlResult: T) {
    return this.isSqliteD1(sqlResult) ? sqlResult.results : sqlResult;
  }
}
