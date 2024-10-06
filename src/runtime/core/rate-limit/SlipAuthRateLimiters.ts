import { Throttler, createThrottlerStorage } from "./Throttler";

export class SlipAuthRateLimiters {
  login: Throttler;

  constructor() {
    this.login = new Throttler({
      points: 5,
      duration: 0,
    },
    {
      storage: createThrottlerStorage("./data/ratelimiter/login"),
    });
  }
}
