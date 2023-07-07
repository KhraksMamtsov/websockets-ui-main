import * as tg from "../../lib/typeGuard";
import { Type } from "./type";

export const smallShipTg = tg.shape({
  type: tg.string([Type.S]),
  length: tg.number([1]),
  direction: tg.boolean(),
  position: tg.shape({
    x: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    y: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  }),
});
