import { pipe } from "../lib/functions";
import type { User } from "../entity/user";
import * as G from "../entity/game";
import * as M from "../lib/map";
import * as RA from "../lib/readonlyArray";
import * as O from "../lib/option";

export class GameDb {
  #currentIndex = 0;
  #pending = new Map<number, G.PendingGame>();
  #singlePending = new Map<number, G.SinglePendingGame>();
  #active = new Map<number, G.ActiveGame>();
  #singleActive = new Map<number, G.SingleActiveGame>();

  getAllPending = () => [...this.#pending.values()];
  getAllSinglePending = () => [...this.#singlePending.values()];
  getAllActive = () => [...this.#active.values()];

  getActiveById = (id: number) =>
    pipe(
      this.#active,
      M.get(id),
      O.alt(() => pipe(this.#singleActive, M.get(id)))
    );

  getActiveByPlayer = (player: User) =>
    pipe(this.getAllActive(), RA.findFirst(G.isWithPlayer(player)));

  getPendingByPlayer = (player: User) =>
    pipe(
      this.getAllPending(),
      RA.findFirst(G.isWithPlayer(player)),
      O.alt(() =>
        pipe(this.getAllSinglePending(), RA.findFirst(G.isWithPlayer(player)))
      )
    );

  createPending = (players: { left: User; right: User }) => {
    const newGame = G.pending({ ...players, id: this.#currentIndex++ });
    this.#pending.set(newGame.id, newGame);

    this.#currentIndex++;

    return newGame;
  };

  createSinglePending = (player: User) => {
    const newGame = G.singlePending({ player, id: this.#currentIndex++ });
    this.#singlePending.set(newGame.id, newGame);

    this.#currentIndex++;

    return newGame;
  };

  deletePending = (gameId: number) => {
    this.#pending.delete(gameId);
  };
  deleteSinglePending = (gameId: number) => {
    this.#singlePending.delete(gameId);
  };

  updatePending = (game: G.PendingGame) => {
    this.#pending.set(game.id, game);
  };

  updateActive = (game: G.ActiveGame) => {
    this.#active.set(game.id, game);
  };
  updateSingleActive = (game: G.SingleActiveGame) => {
    this.#singleActive.set(game.id, game);
  };

  createActive = (activeGame: G.ActiveGame) => {
    this.deletePending(activeGame.id);

    this.#active.set(activeGame.id, activeGame);
  };
  createSingleActive = (singleGame: G.SingleActiveGame) => {
    this.deleteSinglePending(singleGame.id);

    this.#singleActive.set(singleGame.id, singleGame);
  };
}
