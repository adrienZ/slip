import { SlipAuthCore } from "../../core/core";
import {
  useRuntimeConfig,
  // @ts-expect-error useDatabase is not enabled by default
  useDatabase,
} from "#imports";
import { setupIpInfoAddOn } from "../../core/plugins/ipInfoPlugin";

let instance: SlipAuthCore;

export function useSlipAuth() {
  const config = useRuntimeConfig();
  const slipAuthConfig = config.slipAuth;

  if (!instance) {
    instance = new SlipAuthCore(useDatabase(slipAuthConfig.database.nitroDatabaseName), slipAuthConfig.tableNames, {
      sessionMaxAge: slipAuthConfig.sessionMaxAge,
    });

    if (config.slipAuthIpInfoToken && typeof config.slipAuthIpInfoToken === "string" && config.slipAuthIpInfoToken.length > 0) {
      setupIpInfoAddOn(instance, config.slipAuthIpInfoToken);
    }
  }

  return instance;
}
