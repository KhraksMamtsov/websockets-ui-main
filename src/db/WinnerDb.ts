import * as O from "../lib/option";
import { pipe } from "../lib/functions";
import type { User } from "../entity/user";

export class WinnerDb {
  #winners = new Map<number, { wins: number; name: string }>();

  getAll = () => {
    return [...this.#winners.values()];
  };

  getById = (userId: number) => {
    if (this.#winners.has(userId)) {
      const winnerData = this.#winners.get(userId)!;
      return O.some(winnerData);
    } else {
      return O.none;
    }
  };

  writeWinner = (winner: User) => {
    const newScore = pipe(
      this.getById(winner.id),
      O.map((x) => x.wins + 1),
      O.get(() => 1)
    );
    this.#winners.set(winner.id, { wins: newScore, name: winner.name });

    return this;
  };
}
