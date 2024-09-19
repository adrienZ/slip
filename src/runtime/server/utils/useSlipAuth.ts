import { SlipAuthCore } from "../../core/core";
import {
  useRuntimeConfig,
  // @ts-expect-error useDatabase is not enabled by default
  useDatabase,
} from "#imports";
import type { IPinfo } from "node-ipinfo";
import { IPinfoWrapper, ApiLimitError } from "node-ipinfo";
import net from "node:net";
import fsDriver from "unstorage/drivers/fs";
import { createStorage } from "unstorage";
import { slipAuthExtendWithRateLimit } from "../../core/plugins/rate-limit";

let instance: SlipAuthCore;

export function useSlipAuth() {
  const config = useRuntimeConfig();
  const slipAuthConfig = config.slipAuth;

  if (!instance) {
    instance = new SlipAuthCore(useDatabase(), slipAuthConfig.tableNames, {
      sessionMaxAge: slipAuthConfig.sessionMaxAge,
    });

    slipAuthExtendWithRateLimit(instance);

    if (config.slipAuthIpInfoToken && typeof config.slipAuthIpInfoToken === "string" && config.slipAuthIpInfoToken.length > 0) {
      setupIpInfoAddOn(instance, config.slipAuthIpInfoToken);
    }
  }

  return instance;
}

// TODO: build a plugin system
const setupIpInfoAddOn = (auth: SlipAuthCore, ipInfoToken: string) => {
  const ipinfoWrapper = new IPinfoWrapper(ipInfoToken);
  const cache = createStorage<IPinfo>({
    driver: fsDriver({
      base: "./.data/cache/ipinfo",
    }),
  });

  auth.hooks.hook("sessions:create", async (session) => {
    session.ip = "92.168.1.58";
    if (!session.ip) {
      return;
    }
    const ipType = net.isIP(session.ip);

    if (ipType === 0) {
      // valid cases are 4 and 6 (ipv)
      return;
    }

    const cachedValue = await cache.getItem(session.ip);
    if (cachedValue !== null) {
      return;
    }

    try {
      const response = await ipinfoWrapper.lookupIp(session.ip);
      cache.setItem(session.ip, response);
    }
    catch (error) {
      console.log(error);
      if (error instanceof ApiLimitError) {
        // handle api limit exceed error
      }
      else {
        // handle other errors
      }
    }
  });
};
