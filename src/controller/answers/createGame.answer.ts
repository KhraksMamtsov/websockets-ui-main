import { answer } from "./answer";
import * as G from "../../entity/game";
import type { User } from "../../entity/user";

export const createGameAnswer = (args: {
  game: G.SinglePendingGame | G.PendingGame;
  player: User;
}) =>
  answer("create_game")({
    idGame: args.game.id,
    idPlayer: args.player.id,
  });
