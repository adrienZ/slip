import { SlipAuthErrorsCode } from "./SlipAuthErrorsCode";

export class SlipAuthError extends Error {
  slipError!: SlipAuthErrorsCode;
};

export class SlipAuthRateLimiterError extends SlipAuthError {
  data: {
    msBeforeNext?: number
  };

  constructor(data: { msBeforeNext?: number }) {
    super();
    this.data = data;
  }
}

export class UnhandledError extends SlipAuthError {
  override name = "InvalidEmailOrPasswordError";
  override slipError = SlipAuthErrorsCode.Unhandled;
}

export class InvalidEmailOrPasswordError extends SlipAuthError {
  override slipError = SlipAuthErrorsCode.InvalidEmailOrPassword;
  override name = "InvalidEmailOrPasswordError";
  // eslint-disable-next-line no-unused-private-class-members
  #debugReason: string;

  constructor(reason: string) {
    super();
    this.#debugReason = reason;
  }
}

export class InvalidEmailToResetPasswordError extends SlipAuthError {
  override name = "InvalidEmailToResetPasswordError";
  override slipError = SlipAuthErrorsCode.InvalidEmailToResetPassword;
}

export class InvalidUserIdToResetPasswordError extends SlipAuthError {
  override name = "InvalidUserIdToResetPasswordError";
  override slipError = SlipAuthErrorsCode.InvalidUserIdToResetPassword;
}

export class InvalidPasswordToResetError extends SlipAuthError {
  override name = "InvalidPasswordToResetError";
  override slipError = SlipAuthErrorsCode.InvalidPasswordToReset;
}
export class ResetPasswordTokenExpiredError extends SlipAuthError {
  override name = "ResetPasswordTokenExpiredError";
  override slipError = SlipAuthErrorsCode.ResetPasswordTokenExpired;
}

export class RateLimitLoginError extends SlipAuthRateLimiterError {
  override name = "RateLimitLoginError";
  override slipError = SlipAuthErrorsCode.RateLimitLogin;
}
