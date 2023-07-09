import { randomInt } from "../lib/random";

export type Coords = {
  readonly x: number;
  readonly y: number;
};

export const isEqual = (a: Coords) => (b: Coords) => a.x === b.x && a.y === b.y;

export const random = () => {
  return {
    x: randomInt(0, 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    y: randomInt(0, 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  };
};
