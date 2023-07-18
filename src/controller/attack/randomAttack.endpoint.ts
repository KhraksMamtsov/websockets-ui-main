import { endpoint } from "../controller";
import { attackHandler } from "./attack.handler";
import * as tg from "../../lib/typeGuard";
import * as C from "../../entity/coords";
import * as B from "../../entity/board";
import { randomInt } from "../../lib/random";

export const randomAttackEndpoint = endpoint(
  "randomAttack",
  tg.shape({
    indexPlayer: tg.number(),
    gameId: tg.number(),
  }),
  (command) =>
    attackHandler((b) => {
      const emptyCells = B.getEmptyCoords(b);

      if (emptyCells.length > 0) {
        const randomIndex = randomInt(0, emptyCells.length - 1);
        return emptyCells[randomIndex]!;
      } else {
        return C.random();
      }
    })({
      data: {
        ...C.random(),
        gameId: command.data.gameId,
        indexPlayer: command.data.indexPlayer,
      },
    })
);
