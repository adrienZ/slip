import { generateRandomString, alphabet, sha256 } from "oslo/crypto";
import type { Options as ArgonOptions } from "@node-rs/argon2";
import { hash, verify } from "@node-rs/argon2";
import { encodeHex } from "oslo/encoding";

/**
  https://thecopenhagenbook.com/email-verification#input-validation

  Input validation
  Emails are complex and cannot be fully validated using Regex. Attempting to use Regex may also introduce ReDoS vulnerabilities. Do not over-complicate it:

  Includes at least 1 @ character.
  Has at least 1 character before the@.
  The domain part includes at least 1 . and has at least 1 character before it.
  It does not start or end with a whitespace.
  Maximum of 255 characters.
 */

export function isValidEmail(email: string): boolean {
  return /.+@.+/.test(email);
}

export const defaultIdGenerationMethod = () => generateRandomString(15, alphabet("a-z", "A-Z", "0-9"));

export const defaultEmailVerificationCodeGenerationMethod = () => generateRandomString(6, alphabet("0-9", "A-Z"));
export const defaultResetPasswordTokenIdMethod = () => generateRandomString(40, alphabet("0-9", "A-Z"));
export const defaultResetPasswordTokenHashMethod = async (tokenId: string) => encodeHex(await sha256(new TextEncoder().encode(tokenId)));

const hashOptions: ArgonOptions = {
  // recommended minimum parameters
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function defaultHashPasswordMethod(rawPassword: string): Promise<string> {
  return await hash(rawPassword, hashOptions);
};

export async function defaultVerifyPasswordMethod(sourceHashedPassword: string, rawPassword: string): Promise<boolean> {
  return verify(sourceHashedPassword, rawPassword, hashOptions);
};
