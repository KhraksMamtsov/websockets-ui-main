import { pipe } from "../lib/functions";
import type { User } from "../entity/user";
import * as G from "../entity/game";
import { get } from "../lib/map";

export class GameDb {
  #currentIndex = 0;
  #pending = new Map<number, G.PendingGame>();
  // #active = new Map<number, ActiveGame>();

  // getAll = () => [...this.#pending.values()];

  getPendingById = (id: number) => pipe(this.#pending, get(id));

  create = (players: { left: User; right: User }) => {
    const newGame = G.createPending({ ...players, id: this.#currentIndex++ });
    this.#pending.set(newGame.id, newGame);

    this.#currentIndex++;

    return newGame;
  };
}
