import * as E from "./either";
import { pipe } from "./functions";
import type { Compute } from "./types";

export type Task<T> = () => Promise<T>;

export const of =
  <T>(value: T): Task<T> =>
  () =>
    Promise.resolve(value);

export const run = <T>(task: Task<T>) => task();

export const Do = of({});
export const bindTo =
  <const N extends string>(name: N) =>
  <T>(task: Task<T>): Task<{ [K in N]: T }> =>
    pipe(
      task,
      map((p) => ({ [name]: p } as any))
    );

export const bind =
  <const N extends string, T extends {}, T1>(
    name: N,
    next: (context: T) => Task<T1>
  ) =>
  (prev: Task<T>): Task<Compute<T & Record<N, T1>>> =>
    pipe(
      prev,
      chain((p) =>
        pipe(
          next(p),
          map((n) => ({
            ...p,
            [name]: n,
          })) as any
        )
      )
    );

export const map =
  <T, S>(fn: (value: T) => S) =>
  (task: Task<T>): Task<S> =>
  () =>
    task().then(fn);
export const tap =
  <T>(fn: (value: T) => void) =>
  (task: Task<T>): Task<T> =>
  () =>
    task().then((x) => (fn(x), x));

export const chain =
  <T, S>(fn: (value: T) => Task<S>) =>
  (task: Task<T>): Task<S> =>
  () =>
    task().then((x) => fn(x)());

export const flatten = <T>(task: Task<Task<T>>) =>
  pipe(
    task,
    chain((x) => x)
  );

export const fromIO =
  <T>(io: () => T): Task<T> =>
  () =>
    Promise.resolve(io());

export const sequenceEither = <L, R>(
  either: E.Either<L, Task<R>>
): Task<E.Either<L, R>> => {
  return pipe(
    either,
    E.match((left) => pipe(left, E.left, of), map(E.right))
  );
};

export const sequenceArray =
  <T>(array: Array<Task<T>>): Task<Array<T>> =>
  () =>
    Promise.all(array.map(run));
