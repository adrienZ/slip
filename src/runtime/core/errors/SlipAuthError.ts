import { SlipAuthErrorsCode } from "./SlipAuthErrorsCode";

export class SlipAuthError extends Error {
  slipErrorCode!: SlipAuthErrorsCode;
  slipErrorName!: string;
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
  override slipErrorName = "UnhandledError";
  override slipErrorCode = SlipAuthErrorsCode.Unhandled;
}

export class InvalidEmailOrPasswordError extends SlipAuthError {
  override slipErrorCode = SlipAuthErrorsCode.InvalidEmailOrPassword;
  override slipErrorName = "InvalidEmailOrPasswordError";
  // eslint-disable-next-line no-unused-private-class-members
  #debugReason: string;

  constructor(reason: string) {
    super();
    this.#debugReason = reason;
  }
}

export class InvalidEmailToResetPasswordError extends SlipAuthError {
  override slipErrorName = "InvalidEmailToResetPasswordError";
  override slipErrorCode = SlipAuthErrorsCode.InvalidEmailToResetPassword;
}

export class EmailVerificationFailedError extends SlipAuthError {
  override slipErrorName = "EmailVerificationFailedError";
  override slipErrorCode = SlipAuthErrorsCode.EmailVerificationFailedError;
}

export class EmailVerificationCodeExpiredError extends SlipAuthError {
  override slipErrorName = "EmailVerificationCodeExpiredError";
  override slipErrorCode = SlipAuthErrorsCode.EmailVerificationCodeExpired;
}

export class InvalidUserIdToResetPasswordError extends SlipAuthError {
  override slipErrorName = "InvalidUserIdToResetPasswordError";
  override slipErrorCode = SlipAuthErrorsCode.InvalidUserIdToResetPassword;
}

export class InvalidPasswordToResetError extends SlipAuthError {
  override slipErrorName = "InvalidPasswordToResetError";
  override slipErrorCode = SlipAuthErrorsCode.InvalidPasswordToReset;
}
export class ResetPasswordTokenExpiredError extends SlipAuthError {
  override slipErrorName = "ResetPasswordTokenExpiredError";
  override slipErrorCode = SlipAuthErrorsCode.ResetPasswordTokenExpired;
}

export class RateLimitLoginError extends SlipAuthRateLimiterError {
  override slipErrorName = "RateLimitLoginError";
  override slipErrorCode = SlipAuthErrorsCode.RateLimitLogin;
}

export class RateLimitAskEmailVerificationError extends SlipAuthRateLimiterError {
  override slipErrorName = "RateLimitAskEmailVerificationError";
  override slipErrorCode = SlipAuthErrorsCode.RateLimitAskEmailVerification;
}

export class RateLimitVerifyEmailVerificationError extends SlipAuthRateLimiterError {
  override slipErrorName = "RateLimitVerifyEmailVerificationError";
  override slipErrorCode = SlipAuthErrorsCode.RateLimitVerifyEmailVerification;
}

export class RateLimitAskResetPasswordError extends SlipAuthRateLimiterError {
  override slipErrorName = "RateLimitAskResetPasswordError";
  override slipErrorCode = SlipAuthErrorsCode.RateLimitAskResetPassword;
}

export class RateLimitVerifyResetPasswordError extends SlipAuthRateLimiterError {
  override slipErrorName = "RateLimitVerifyResetPasswordError";
  override slipErrorCode = SlipAuthErrorsCode.RateLimitVerifyResetPassword;
}
