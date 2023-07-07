import * as tg from "../../lib/typeGuard";

const shipTg = tg.shape({
  position: tg.shape({
    x: tg.number(),
    y: tg.number(),
  }),
  direction: tg.boolean(),
  length: tg.number(),
  type: tg.string(["small", "medium", "large", "huge"]),
});

export const boardTg = tg.array(shipTg);

export type BoardDto = tg.Infer<typeof boardTg>;
export type ShipDto = tg.Infer<typeof shipTg>;
