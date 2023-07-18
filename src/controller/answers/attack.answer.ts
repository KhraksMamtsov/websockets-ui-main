import { answer } from "./answer";
import type { User } from "../../entity/user";
import * as AR from "../../entity/attackResult";

export const attackAnswer = (args: {
  attackResult: AR.Killed | AR.Shot | AR.Miss;
  currentPlayer: User;
}) =>
  answer("attack")({
    position: args.attackResult.coords,
    currentPlayer: args.currentPlayer.id,
    status: args.attackResult.type,
  });
