/**
 * Compat shim for a very small subset of the `oslo` date utilities used by this project.
 *
 * This file provides the minimal API used in this repo: `TimeSpan`, `createDate` and
 * `isWithinExpirationDate`.
 *
 * It exists to avoid having to depend on the (deprecated) upstream `oslo` package for
 * these tiny helpers. Keep this file small and focused — it aims to be a drop-in
 * replacement for the calls used here.
 *
 * NOTE: This is a compatibility file (local shim). It intentionally implements only the
 * small behavior the project relies on. If you need different semantics, update callers
 * accordingly.
 *
 * Based on the behaviour used in the project and the original upstream helpers:
 * https://github.com/pilcrowonpaper/oslo
 */

type TimeSpanUnit = "ms" | "s" | "m" | "h" | "d" | "w";

export class TimeSpan {
  constructor(value: number, unit: TimeSpanUnit) {
    this.value = value;
    this.unit = unit;
  }

  public value: number;
  public unit: TimeSpanUnit;

  public milliseconds(): number {
    if (this.unit === "ms") {
      return this.value;
    }
    if (this.unit === "s") {
      return this.value * 1000;
    }
    if (this.unit === "m") {
      return this.value * 1000 * 60;
    }
    if (this.unit === "h") {
      return this.value * 1000 * 60 * 60;
    }
    if (this.unit === "d") {
      return this.value * 1000 * 60 * 60 * 24;
    }
    return this.value * 1000 * 60 * 60 * 24 * 7;
  }

  public seconds(): number {
    return this.milliseconds() / 1000;
  }

  public transform(x: number): TimeSpan {
    return new TimeSpan(Math.round(this.milliseconds() * x), "ms");
  }
}

export function isWithinExpirationDate(date: Date): boolean {
  return Date.now() < date.getTime();
}

export function createDate(timeSpan: TimeSpan): Date {
  return new Date(Date.now() + timeSpan.milliseconds());
}
