import * as tg from "../../lib/typeGuard";

export const shipsTg = tg.array(
  tg.shape({
    position: tg.shape({
      x: tg.number(),
      y: tg.number(),
    }),
    direction: tg.boolean(),
    length: tg.number(),
    type: tg.string(["small", "medium", "large", "huge"]),
  })
);

export type ShipsDto = tg.Infer<typeof shipsTg>;
