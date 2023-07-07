import { answer } from "./answer";
import type { PendingGame } from "../../entity/game";
import type { User } from "../../entity/user";

export const createGameAnswer = (args: { game: PendingGame; player: User }) =>
  answer("create_game")({
    idGame: args.game.id,
    idPlayer: args.player.id,
  });
