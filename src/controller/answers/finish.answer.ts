import { answer } from "./answer";
import type { User } from "../../entity/user";

export const finishAnswer = (args: { player: User }) =>
  answer("finish")({
    winPlayer: args.player.id,
  });
