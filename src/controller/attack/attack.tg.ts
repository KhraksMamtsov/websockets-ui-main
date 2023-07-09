import * as tg from "../../lib/typeGuard";

export const attackTg = tg.shape({
  x: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  y: tg.number([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  indexPlayer: tg.number(),
  gameId: tg.number(),
});

export type AttackDto = tg.Infer<typeof attackTg>;
