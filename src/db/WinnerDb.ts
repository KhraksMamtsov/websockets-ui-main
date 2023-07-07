import * as O from "../lib/option";
import { pipe } from "../lib/functions";

export class WinnerDb {
  #winners = new Map<string, { wins: number }>();

  getAll = () => {
    return [...this.#winners].map(([name, { wins }]) => ({
      name,
      wins,
    }));
  };

  getByName = (winnerName: string) => {
    if (this.#winners.has(winnerName)) {
      const winnerData = this.#winners.get(winnerName)!;
      return O.some(winnerData);
    } else {
      return O.none;
    }
  };

  writeWinner = (winnerName: string) => {
    const newScore = pipe(
      this.getByName(winnerName),
      O.map((x) => x.wins + 1),
      O.get(() => 1)
    );
    this.#winners.set(winnerName, { wins: newScore });

    return this;
  };
}
