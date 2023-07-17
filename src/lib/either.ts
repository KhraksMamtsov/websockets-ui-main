import type { TypeGuard } from "./typeGuard";
import * as O from "./option";
import { pipe } from "./functions";
import type { Compute } from "./types";

export type Right<R> = { tag: "right"; right: R };

export type Either<L, R> = ReturnType<typeof left<L>> | Right<R>;

export const left = <L>(left: L) => ({ tag: "left", left } as const);
export const right = <R>(right: R): Either<never, R> =>
  ({ tag: "right", right } as const);

export const isRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either.tag === "right";
export const of = <R>(right: R): Either<never, R> =>
  ({ tag: "right", right } as const);

export const Do = of({});
export const bindTo =
  <const N extends string>(name: N) =>
  <L, R>(either: Either<L, R>): Either<L, { [K in N]: R }> =>
    pipe(
      either,
      map((p) => ({ [name]: p } as any))
    );
export const bind =
  <const N extends string, L, R, CR extends {}>(
    name: N,
    fn: (ctx: CR) => Either<L, R>
  ) =>
  <CL>(
    context: Either<CL, CR>
  ): Either<L | CL, Compute<CR & { [K in N]: R }>> => {
    return pipe(
      context,
      chain((cr) =>
        pipe(
          fn(cr),
          map((r) => ({ ...cr, [name]: r } as any))
        )
      )
    );
  };

export const match =
  <L, R, L1, R1>(onLeft: (left: L) => L1, onRight: (right: R) => R1) =>
  (either: Either<L, R>) =>
    either.tag === "left" ? onLeft(either.left) : onRight(either.right);

export const map =
  <R, R1>(fn: (value: R) => R1) =>
  <L>(either: Either<L, R>): Either<L, R1> =>
    either.tag === "left" ? either : right(fn(either.right));

export const swap = <L, R>(either: Either<L, R>): Either<R, L> =>
  either.tag === "left" ? right(either.left) : left(either.right);

export const mapLeft =
  <L, L1>(fn: (value: L) => L1) =>
  <R>(either: Either<L, R>): Either<L1, R> =>
    either.tag === "right" ? either : left(fn(either.left));

export const bimap =
  <L, L1, R, R1>(onLeft: (value: L) => L1, onRight: (value: R) => R1) =>
  (either: Either<L, R>): Either<L1, R1> =>
    either.tag === "left"
      ? left(onLeft(either.left))
      : right(onRight(either.right));
export const toUnion = <L, R>(either: Either<L, R>): L | R =>
  either.tag === "left" ? either.left : either.right;

export const tap =
  <R>(fn: (value: R) => void) =>
  <L>(either: Either<L, R>): Either<L, R> =>
    either.tag === "left" ? either : (fn(either.right), either);
export const bitap =
  <L, R>(onLeft: (left: L) => void, onRight: (right: R) => void) =>
  (either: Either<L, R>): Either<L, R> => (
    either.tag === "left" ? onLeft(either.left) : onRight(either.right), either
  );

export const chain =
  <R, L1, R1>(fn: (value: R) => Either<L1, R1>) =>
  <L>(either: Either<L, R>): Either<L | L1, R1> =>
    either.tag === "left" ? either : fn(either.right);

export const flatten = <L, L1, R>(
  either: Either<L, Either<L1, R>>
): Either<L | L1, R> =>
  pipe(
    either,
    chain((x) => x)
  );

export function fromPredicate<T, X extends T, L, R extends T>(
  refinement: TypeGuard<T, R>,
  onFalse: (x: X) => L
): (x: X) => Either<L, Compute<R>>;
export function fromPredicate<T, L>(
  refinement: (x: T) => boolean,
  onFalse: (x: T) => L
): (x: T) => Either<L, T>;
export function fromPredicate<T, L>(
  refinement: (x: T) => boolean,
  onFalse: (x: T) => L
): (x: T) => Either<L, T> {
  return (x) => (refinement(x) ? right(x) : left(onFalse(x)));
}

export function filter<A, L1, B extends A>(
  refinement: TypeGuard<A, B>,
  onFalse: (x: A) => L1
): <L>(either: Either<L, A>) => Either<L | L1, Compute<B>>;
export function filter<A, L1>(
  refinement: (x: A) => boolean,
  onFalse: (x: A) => L1
): <L, B extends A>(either: Either<L, B>) => Either<L | L1, B>;
export function filter<A, L1>(
  refinement: (x: A) => boolean,
  onFalse: (x: A) => L1
): <L>(either: Either<L, A>) => Either<L | L1, A> {
  return chain((x) => (refinement(x) ? right(x) : left(onFalse(x))));
}

export const fromOption =
  <L>(onNone: () => L) =>
  <R>(option: O.Option<R>): Either<L, R> =>
    pipe(
      option,
      O.match(() => left(onNone()), right)
    );

export const tryCatch =
  <L, R>(fn: (x: L) => R) =>
  (x: L): Either<L, R> => {
    try {
      return right(fn(x));
    } catch {
      return left(x);
    }
  };

export const get =
  <L, L1>(onLeft: (left: L) => L1) =>
  <R>(either: Either<L, R>) =>
    pipe(
      either,
      match(onLeft, (x) => x)
    );
