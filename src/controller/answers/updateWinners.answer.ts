import { answer } from "./answer";

export const updateWinnersAnswer = (
  winners: ReadonlyArray<{ name: string; wins: number }>
) => answer("update_winners")(winners);
