export enum SlipAuthErrorsCode {
  Unhandled = "Unhandled",
  InvalidEmailOrPassword = "InvalidEmailOrPassword",
  EmailVerificationFailedError = "EmailVerificationFailed",
  EmailVerificationCodeExpired = "EmailVerificationCodeExpired",
  InvalidEmailToResetPassword = "InvalidEmailToResetPassword",
  InvalidUserIdToResetPassword = "InvalidUserIdToResetPassword",
  InvalidPasswordToReset = "InvalidPasswordToReset",
  ResetPasswordTokenExpired = "ResetPasswordTokenExpired",
  RateLimitLogin = "RateLimitLogin",
  RateLimitAskEmailVerification = "RateLimitAskEmailVerification",
  RateLimitVerifyEmailVerification = "RateLimitVerifyEmailVerification",
}
