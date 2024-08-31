import { SlipAuthCore } from "../../core/core";
import {
  useRuntimeConfig,
  // @ts-expect-error useDatabase is not enabled by default
  useDatabase,
} from "#imports";

let instance: SlipAuthCore;

export function useSlipAuth() {
  const config = useRuntimeConfig().slipAuth;

  if (!instance) {
    instance = new SlipAuthCore(useDatabase(), config.tableNames, {
      sessionMaxAge: config.sessionMaxAge,
    });
  }

  return instance;
}
