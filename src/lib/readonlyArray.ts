import * as O from "./option";
import type { TypeGuard } from "./typeGuard";
import * as E from "./either";
import { pipe } from "./functions";

export function findFirst<A, B extends A>(
  refinement: TypeGuard<A, B>
): (array: ReadonlyArray<A>) => O.Option<B>;
export function findFirst<A>(
  predicate: (el: A) => boolean
): <B extends A>(array: ReadonlyArray<B>) => O.Option<B>;
export function findFirst<A>(
  predicate: (el: A) => boolean
): (array: ReadonlyArray<A>) => O.Option<A>;
export function findFirst<A>(predicate: (el: A) => boolean) {
  return (array: ReadonlyArray<A>) => O.fromUndefinable(array.find(predicate));
}
export function some<A>(predicate: (el: A) => boolean) {
  return (array: ReadonlyArray<A>) => array.some(predicate);
}

export const of = <A>(a: A) => [a];

export function filter<A, B extends A>(
  refinement: TypeGuard<A, B>
): (array: ReadonlyArray<A>) => B[];
export function filter<A>(
  predicate: (el: A) => boolean
): (array: ReadonlyArray<A>) => A[];
export function filter<A>(predicate: (el: A) => boolean) {
  return (array: ReadonlyArray<A>) => array.filter(predicate);
}

export const map =
  <A, A1>(fn: (el: A) => A1) =>
  (array: ReadonlyArray<A>) =>
    array.map(fn);

export const chain =
  <A, A1>(fn: (el: A) => ReadonlyArray<A1>) =>
  (array: ReadonlyArray<A>) =>
    array.flatMap(fn);
export const flatten = <A>(array: ReadonlyArray<ReadonlyArray<A>>) =>
  array.flat();

export const partition = <L, R>(
  array: ReadonlyArray<E.Either<L, R>>
): readonly [ReadonlyArray<L>, ReadonlyArray<R>] => {
  return pipe(
    array,
    reduce(
      (separated, either) => {
        E.isRight(either)
          ? separated[1].push(either.right)
          : separated[0].push(either.left);
        return separated;
      },
      [[], []] as [Array<L>, Array<R>]
    )
  );
};

export const validate = <L, R>(
  array: ReadonlyArray<E.Either<L, R>>
): E.Either<ReadonlyArray<L>, ReadonlyArray<R>> => {
  return pipe(
    //
    array,
    partition,
    (separated) =>
      separated[0].length === 0 ? E.right(separated[1]) : E.left(separated[0])
  );
};

export const group =
  <A, K extends string>(fn: (element: A) => K) =>
  (array: ReadonlyArray<A>): Readonly<Record<K, ReadonlyArray<A>>> => {
    const result = pipe(
      array,
      reduce((acc, cur) => {
        const key = fn(cur);

        if (key in acc) {
          acc[key]!.push(cur);
        } else {
          acc[key] = [cur];
        }
        return acc;
      }, {} as Partial<Record<K, Array<A>>>)
    );

    return result as Readonly<Record<K, ReadonlyArray<A>>>;
  };

export const entries = <K extends keyof any, V>(
  record: Record<K, V>
): Array<[K, V]> => Object.entries(record) as any;
export const range = (
  borders: [from: number, to: number]
): ReadonlyArray<number> => {
  const [from, to] = borders;

  return Array.from({ length: to - from }).map((_, i) => from + i);
};

export const compact = <A>(array: ReadonlyArray<O.Option<A>>): A[] =>
  pipe(
    array,
    filter(O.isSome),
    map((x) => x.value)
  );

export const unify = <RA extends ReadonlyArray<unknown>>(
  array: RA
): [RA] extends [ReadonlyArray<infer A>] ? Array<A> : never => array as any;

export const isNotEmpty = <A>(array: ReadonlyArray<A>) => array.length !== 0;

export const reduce =
  <A, A1>(fn: (acc: A1, el: A) => A1, acc: A1) =>
  (array: ReadonlyArray<A>) =>
    array.reduce(fn, acc);
