import { answer } from "./answer";

export const turnAnswer = (args: { playerId: number }) =>
  answer("turn")({
    currentPlayer: args.playerId,
  });
