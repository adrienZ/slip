import { describe, it, expect } from 'vitest';
import cloudflareD1 from "db0/connectors/cloudflare-d1";
import { checkAndCreateDb } from "../index"

describe('checkAndCreateDb', () => {
  it('should throw an error when no arguments are provided', async () => {
    // @ts-expect-error test function with no parameters
    await expect(checkAndCreateDb()).rejects.toThrowError("No database connector to check, please provide one");
  });

  it('should throw an error when a fake connector', async () => {
    const unsupportedConnector = cloudflareD1({});
    await expect(checkAndCreateDb(unsupportedConnector)).rejects.toThrowError("Invalid enum value. Expected 'sqlite' | 'postgresql', received 'cloudflare-d1'");
  });
});