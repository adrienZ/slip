import type { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";
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
}
