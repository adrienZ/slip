import { Throttler, createThrottlerStorage } from "./Throttler";
import { prefixStorage } from "unstorage";

export class SlipAuthRateLimiters {
  login: Throttler;
  askEmailVerification: Throttler;
  verifyEmailVerification: Throttler;
  askResetPassword: Throttler;
  verifyResetPassword: Throttler;

  constructor() {
    this.login = new Throttler({
      timeoutSeconds: [0, 1, 2, 4, 8, 16, 30, 60, 180, 300],
      storage: prefixStorage(createThrottlerStorage(), "slip:rate:login"),
    });

    this.askEmailVerification = new Throttler({
      timeoutSeconds: [0, 2, 4, 8, 32, 60, 180, 240, 480, 720],
      storage: prefixStorage(createThrottlerStorage(), "slip:rate:ask-email-verification"),
    });

    this.askResetPassword = new Throttler({
      timeoutSeconds: [0, 2, 4, 8, 32, 60, 180, 240, 480, 720],
      storage: prefixStorage(createThrottlerStorage(), "slip:rate:ask-reset-password"),
    });

    this.verifyEmailVerification = new Throttler({
      timeoutSeconds: [0, 1, 2, 4, 8, 16, 30, 60, 180, 300],
      storage: prefixStorage(createThrottlerStorage(), "slip:rate:verify-email-verification"),
    });

    this.verifyResetPassword = new Throttler({
      timeoutSeconds: [0, 1, 2, 4, 8, 16, 30, 60, 180, 300],
      storage: prefixStorage(createThrottlerStorage(), "slip:rate:verify-reset-password"),
    });
  }
}
