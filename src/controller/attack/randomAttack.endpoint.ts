import { endpoint } from "../controller";
import { attackHandler } from "./attack.handler";
import * as tg from "../../lib/typeGuard";
import { random } from "../../entity/coords";

export const randomAttackEndpoint = endpoint(
  "randomAttack",
  tg.shape({
    indexPlayer: tg.number(),
    gameId: tg.number(),
  }),
  (command) =>
    attackHandler({
      data: {
        ...random(),
        gameId: command.data.gameId,
        indexPlayer: command.data.indexPlayer,
      },
    })
);
