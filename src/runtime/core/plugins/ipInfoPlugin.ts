import type { IPinfo } from "node-ipinfo";
import { IPinfoWrapper, ApiLimitError } from "node-ipinfo";
import net from "node:net";
import fsDriver from "unstorage/drivers/fs";
import { createStorage } from "unstorage";
import type { SlipAuthCore } from "../core";

export const setupIpInfoAddOn = (auth: SlipAuthCore, ipInfoToken: string) => {
  const ipinfoWrapper = new IPinfoWrapper(ipInfoToken);
  const cache = createStorage<IPinfo>({
    driver: fsDriver({
      base: "./.data/cache/ipinfo",
    }),
  });

  auth.hooks.hook("sessions:create", async (session) => {
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
