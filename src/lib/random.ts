import { pipe } from "./functions";

export const randomInt = (low: number, high: number): number =>
  pipe(Math.random(), (n) => Math.floor((high - low + 1) * n + low));
