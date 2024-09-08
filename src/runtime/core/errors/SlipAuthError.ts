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
