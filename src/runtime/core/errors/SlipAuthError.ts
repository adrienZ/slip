import { SlipAuthErrorsCode } from "./SlipAuthErrorsCode";

export class SlipAuthError extends Error {
  slipError!: SlipAuthErrorsCode;
};

export class UnhandledError extends SlipAuthError {
  override name = "InvalidEmailOrPasswordError";
  override message = "InvalidEmailOrPasswordError";
  override slipError = SlipAuthErrorsCode.Unhandled;
}

export class InvalidEmailOrPasswordError extends SlipAuthError {
  override slipError = SlipAuthErrorsCode.InvalidEmailOrPassword;
  override name = "InvalidEmailOrPasswordError";
  override message = "InvalidEmailOrPasswordError";
  // eslint-disable-next-line no-unused-private-class-members
  #debugReason: string;

  constructor(reason: string) {
    super();
    this.#debugReason = reason;
  }
}

export class LoginRateLimitError extends SlipAuthError {
  override slipError = SlipAuthErrorsCode.LogginRateLimit;
  override name = "LoginRateLimitError";
  override message = "LoginRateLimitError";
  unlockedAt?: Date;

  constructor(unlockedAt?: Date) {
    super("LogginRateLimitError", {});

    if (unlockedAt) {
      this.unlockedAt = unlockedAt;
    }
  }
};
