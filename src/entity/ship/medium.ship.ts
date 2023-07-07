import * as tg from "../../lib/typeGuard";
import { pipe } from "../../lib/functions";
import { Type } from "./type";

const twoVertical = tg.shape({
  direction: tg.boolean(true),
  position: tg.shape({
    x: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    y: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8]),
  }),
});

const twoHorizontal = tg.shape({
  direction: tg.boolean(false),
  position: tg.shape({
    x: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    y: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  }),
});

export const mediumShipTg = pipe(
  tg.shape({
    type: tg.string([Type.M]),
    length: tg.number([2]),
  }),
  tg.and(tg.union([twoVertical, twoHorizontal]))
);
