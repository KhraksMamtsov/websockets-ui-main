import { pipe } from "../lib/functions";
import type { User } from "../entity/user";
import * as G from "../entity/game";
import { get } from "../lib/map";
import * as RA from "../lib/readonlyArray";

export class GameDb {
  #currentIndex = 0;
  #pending = new Map<number, G.PendingGame>();
  #active = new Map<number, G.ActiveGame>();

  getAllPending = () => [...this.#pending.values()];

  getPendingById = (id: number) => pipe(this.#pending, get(id));
  getPendingByPlayer = (player: User) =>
    pipe(this.getAllPending(), RA.findFirst(G.isWithPlayer(player)));

  createPending = (players: { left: User; right: User }) => {
    const newGame = G.createPending({ ...players, id: this.#currentIndex++ });
    this.#pending.set(newGame.id, newGame);

    this.#currentIndex++;

    return newGame;
  };

  deletePending = (gameId: number) => {
    this.#pending.delete(gameId);
  };

  updatePending = (game: G.PendingGame) => {
    this.#pending.set(game.id, game);
  };

  createActive = (activeGame: G.ActiveGame) => {
    this.deletePending(activeGame.id);

    this.#active.set(activeGame.id, activeGame);
  };
}
