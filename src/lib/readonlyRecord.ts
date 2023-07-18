import * as RA from "./readonlyArray";
import { pipe } from "./functions";

export const map =
  <K extends keyof any, V, R>(fn: (value: V, key: K) => R) =>
  (record: Readonly<Record<K, V>>): Record<K, R> =>
    pipe(
      Object.entries(record) as [K, V][],
      RA.map(([k, v]) => [k, fn(v, k)] as const),
      Object.fromEntries
    ) as Record<K, R>;
