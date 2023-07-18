import * as E from "./either";
import * as v from "./typeGuard";
import { pipe } from "./functions";

export type Json = boolean | number | string | null | JsonArray | JsonRecord;
type JsonArray = ReadonlyArray<Json>;
type JsonRecord = { readonly [K in string]: Json };
export const parse = E.tryCatch((x: string) => JSON.parse(x) as Json);
export const stringify = E.tryCatch((x: unknown) => JSON.stringify(x));
export const parseUnknown = (x: unknown) =>
  pipe(
    x,
    E.fromPredicate(v.string(), (x) => x),
    E.chain(parse)
  );

export const validate =
  <T>(validator: v.TypeGuard<unknown, T>) =>
  (x: unknown) =>
    pipe(x, parseUnknown, E.chain(E.fromPredicate(validator, (x) => x)));
