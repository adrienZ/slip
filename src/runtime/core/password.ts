import type { Options as ArgonOptions } from "@node-rs/argon2";
import { hash, verify } from "@node-rs/argon2";

const hashOptions: ArgonOptions = {
  // recommended minimum parameters
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

// TODO: implement salting
// https://thecopenhagenbook.com/password-authentication#argon2id
export function hashPassword(rawPassword: string) {
  return hash(rawPassword, hashOptions);
}

// TODO: implement salting
export function verifyPassword(sourceHashedPassword: string, rawPassword: string) {
  return verify(sourceHashedPassword, rawPassword, hashOptions);
}
