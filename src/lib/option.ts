import type { TypeGuard } from "./typeGuard";

import type { Compute } from "./types";
import { pipe } from "./functions";

export type Option<T> = Some<T> | typeof none;
export type Some<T> = { tag: "some"; value: T };

export const none = { tag: "none" } as const;
export const some = <T>(value: T): Option<T> =>
  ({ tag: "some", value } as const);
export const isSome = <T>(value: Option<T>): value is Some<T> =>
  value.tag === "some";
export const match =
  <T, N, S>(onNone: () => N, onSome: (value: T) => S) =>
  (option: Option<T>) =>
    option.tag === "none" ? onNone() : onSome(option.value);

export function filter<A, B extends A>(
  refinement: TypeGuard<A, B>
): (either: Option<A>) => Option<B>;
export function filter<A>(
  refinement: (x: A) => boolean
): <B extends A>(either: Option<B>) => Option<B>;
export function filter<A>(
  refinement: (x: A) => boolean
): (either: Option<A>) => Option<A> {
  return chain((x) => (refinement(x) ? some(x) : none));
}

export const map =
  <T, S>(fn: (value: T) => S) =>
  (option: Option<T>): Option<S> =>
    option.tag === "none" ? option : some(fn(option.value));

export const get =
  <N>(onNone: () => N) =>
  <S>(option: Option<S>): S | N =>
    option.tag === "none" ? onNone() : option.value;

export const alt =
  <T1>(fn: () => Option<T1>) =>
  <T>(option: Option<T>): Option<T | T1> =>
    option.tag === "none" ? fn() : option;

export const tap =
  <T>(fn: (value: T) => void) =>
  (option: Option<T>): Option<T> =>
    option.tag === "none" ? option : (fn(option.value), option);

export const chain =
  <T, S>(fn: (value: T) => Option<S>) =>
  (option: Option<T>): Option<S> =>
    option.tag === "none" ? option : fn(option.value);

export const flatten = <T>(option: Option<Option<T>>) =>
  pipe(
    option,
    chain((x) => x)
  );

export const fromUndefinable = <X>(value: X): Option<Exclude<X, undefined>> =>
  value === undefined ? none : some(value as Exclude<X, undefined>);

export function fromPredicate<TG extends TypeGuard<any, any>>(
  refinement: TG
): TG extends TypeGuard<infer T, infer T1>
  ? <X extends T>(x: X) => Option<Compute<T1>>
  : never;
export function fromPredicate<T>(
  refinement: (x: T) => boolean
): <B extends T>(x: B) => Option<B>;
export function fromPredicate<T>(
  refinement: (x: T) => boolean
): (x: T) => Option<T>;
export function fromPredicate<T>(
  refinement: (x: T) => boolean
): (x: T) => Option<T> {
  return (x) => (refinement(x) ? some(x) : none);
}

export const toBoolean = <T>(option: Option<T>): boolean => isSome(option);
