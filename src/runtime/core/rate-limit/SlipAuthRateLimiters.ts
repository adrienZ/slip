import { Throttler, createThrottlerStorage } from "./Throttler";

export class SlipAuthRateLimiters {
  login: Throttler;

  constructor() {
    this.login = new Throttler({
      timeoutSeconds: [0, 1, 2, 4, 8, 16, 30, 60, 180, 300],
      storage: createThrottlerStorage(),
    });
  }
}
