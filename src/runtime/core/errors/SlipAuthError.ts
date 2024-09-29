import { SlipAuthErrorsCode } from "./SlipAuthErrorsCode";

class SlipAuthError extends Error {
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

export class InvalidEmailToResetPasswordError extends SlipAuthError {
  override name = "InvalidEmailToResetPasswordError";
  override message = "InvalidEmailToResetPasswordError";
  override slipError = SlipAuthErrorsCode.InvalidEmailToResetPassword;
}

export class InvalidUserIdToResetPasswordError extends SlipAuthError {
  override name = "InvalidUserIdToResetPasswordError";
  override message = "InvalidUserIdToResetPasswordError";
  override slipError = SlipAuthErrorsCode.InvalidUserIdToResetPassword;
}

export class InvalidPasswordToResetError extends SlipAuthError {
  override name = "InvalidPasswordToResetError";
  override message = "InvalidPasswordToResetError";
  override slipError = SlipAuthErrorsCode.InvalidPasswordToReset;
}
export class ResetPasswordTokenExpiredError extends SlipAuthError {
  override name = "ResetPasswordTokenExpiredError";
  override message = "ResetPasswordTokenExpiredError";
  override slipError = SlipAuthErrorsCode.ResetPasswordTokenExpired;
}
