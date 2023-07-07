import type { Compute } from "./types";

export type TypeGuard<A, R extends A> = (x: A) => x is R;

export const string =
  <const S extends ReadonlyArray<string>>(literals?: S) =>
  (x: unknown): x is typeof literals extends undefined ? string : S[number] => {
    if (typeof x === "string") {
      if (literals === undefined) {
        return true;
      } else {
        return literals.includes(x);
      }
    } else {
      return false;
    }
  };

export const refine =
  <T>(predicate: (x: T) => boolean) =>
  (x: T) => {
    return predicate(x);
  };

export const number =
  <S extends number>(literal?: S) =>
  (x: unknown): x is typeof literal extends undefined ? number : S => {
    if (typeof x === "number") {
      if (literal === undefined) {
        return true;
      } else {
        return x === literal;
      }
    } else {
      return false;
    }
  };

export const boolean =
  <S extends boolean>(literal?: S) =>
  (x: unknown): x is typeof literal extends undefined ? number : S => {
    if (typeof x === "boolean") {
      if (literal === undefined) {
        return true;
      } else {
        return x === literal;
      }
    } else {
      return false;
    }
  };

export const unknown = (_: unknown): _ is unknown => true;
const _null = (x: unknown): x is null => x === null;

export { _null as null };

export const array =
  <A, R extends A>(el: TypeGuard<A, R>) =>
  (x: unknown): x is ReadonlyArray<R> =>
    Array.isArray(x) ? x.every(el) : false;

export const and =
  <A, C extends A>(ac: TypeGuard<A, C>) =>
  <B extends A>(ab: TypeGuard<A, B>) =>
  (x: A): x is B & C =>
    ab(x) && ac(x);

export const then =
  <A, B extends A, C extends B>(bc: TypeGuard<B, C>) =>
  (ab: TypeGuard<A, B>) =>
  (x: A): x is C =>
    ab(x) ? bc(x) : false;

type ShapeRefinement<
  O extends Readonly<Record<string, TypeGuard<unknown, unknown>>>
> = Compute<{
  readonly [K in keyof O]: O[K] extends TypeGuard<unknown, infer T> ? T : never;
}>;

export const shape =
  <const O extends Readonly<Record<string, TypeGuard<unknown, unknown>>>>(
    properties: O
  ) =>
  (x: unknown): x is ShapeRefinement<O> => {
    if (x === null || x === undefined) return false;

    const xLength = Object.entries(x).length;
    const p = Object.entries(properties);

    return xLength === p.length && p.every(([k, v]) => v((x as any)[k]));
  };

type TupleRefinement<O extends ReadonlyArray<TypeGuard<unknown, unknown>>> =
  Readonly<{
    [K in keyof O]: O[K] extends TypeGuard<unknown, infer T> ? T : never;
  }>;

export const tuple =
  <const T extends ReadonlyArray<TypeGuard<unknown, unknown>>>(tuple: T) =>
  (x: unknown): x is TupleRefinement<T> =>
    Array.isArray(x)
      ? x.length === tuple.length && tuple.every((v, i) => v(x[i]))
      : false;

export const partial =
  <const P extends Readonly<Record<string, TypeGuard<unknown, unknown>>>>(
    properties: P
  ) =>
  (x: unknown): x is Partial<ShapeRefinement<P>> => {
    if (x === null || x === undefined) return false;
    return Object.entries(x).every(([k, v]) => {
      const validator = properties[k];
      return validator ? validator(v) : false;
    });
  };

export type Infer<X extends TypeGuard<unknown, unknown>> = X extends TypeGuard<
  unknown,
  infer T
>
  ? T
  : never;

const _for =
  <I extends Object>() =>
  <
    P extends {
      [K in keyof I]: TypeGuard<unknown, I[K]>;
    }
  >(
    properties: P
  ) =>
  (x: unknown): x is I =>
    shape(properties)(x);

export { _for as for };
