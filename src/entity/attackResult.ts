import type { Coords } from "./coords";

export enum AttackResultType {
  MISS = "miss",
  KILLED = "killed",
  SHOT = "shot",
  DOUBLE = "double",
}

export type AttackResult = Miss | Killed | Shot | Double;

export type Miss = ReturnType<typeof miss>;
export type Killed = ReturnType<typeof killed>;
export type Shot = ReturnType<typeof shot>;
export type Double = ReturnType<typeof double>;

const attackResult =
  <T extends AttackResultType>(type: T) =>
  (coords: Coords) =>
    ({ type, coords } as const);

export const miss = attackResult(AttackResultType.MISS);

export const isMiss = (attackResult: AttackResult): attackResult is Miss =>
  attackResult.type === AttackResultType.MISS;

export const killed = attackResult(AttackResultType.KILLED);

export const shot = attackResult(AttackResultType.SHOT);

export const isShot = (attackResult: AttackResult) =>
  attackResult.type === AttackResultType.SHOT;
export const double = attackResult(AttackResultType.DOUBLE);

export const isDouble = (attackResult: AttackResult): attackResult is Double =>
  attackResult.type === AttackResultType.DOUBLE;
