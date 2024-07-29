// import type { H3Event } from "h3";
import { SlipAuthCore } from "@slip/core";
import type { SlipModuleOptions } from "../../types";
import { useRuntimeConfig, useDatabase } from "#imports";

let instance: SlipAuthCore;

export function useSlipAuth() {
  const config = useRuntimeConfig().slipAuth as SlipModuleOptions;

  if (!instance) {
    instance = new SlipAuthCore(useDatabase(), config.tableNames);
  }

  return instance;
}
