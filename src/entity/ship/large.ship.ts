import * as tg from "../../lib/typeGuard";
import { pipe } from "../../lib/functions";
import { Type } from "./type";

const verticalPosition = tg.shape({
  direction: tg.boolean(true),
  position: tg.shape({
    x: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    y: tg.number([0, 1, 2, 3, 4, 5, 6, 7]),
  }),
});

const horizontalPosition = tg.shape({
  direction: tg.boolean(false),
  position: tg.shape({
    x: tg.number([0, 1, 2, 3, 4, 5, 6, 7]),
    y: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  }),
});

export const largeShipTg = pipe(
  tg.shape({
    type: tg.string([Type.L]),
    length: tg.number([3]),
  }),
  tg.and(tg.union([verticalPosition, horizontalPosition]))
);
