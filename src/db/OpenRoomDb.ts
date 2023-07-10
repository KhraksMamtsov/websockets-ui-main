import type { User } from "../entity/user";
import * as R from "../entity/openRoom";
import { pipe } from "../lib/functions";
import { get } from "../lib/map";
import * as O from "../lib/option";
import * as RA from "../lib/readonlyArray";

export class OpenRoomDb {
  #currentIndex = 0;
  #rooms = new Map<number, R.OpenRoom>();

  getAll = (): R.OpenRoom[] => [...this.#rooms.values()];

  create = (newPlayer: User) => {
    const newRoom: R.OpenRoom = {
      id: this.#currentIndex++,
      player: newPlayer,
    };

    this.#rooms.set(newRoom.id, newRoom);

    return this.getAll();
  };

  deleteById = (id: number) => {
    this.#rooms.delete(id);

    return this.getAll();
  };
  deleteByOwner = (owner: User) => {
    return pipe(
      this.getAll(),
      RA.findFirst((x) => x.player.id === owner.id),
      O.tap((r) => this.deleteById(r.id)),
      O.map(() => this.getAll())
    );
  };

  getById = (id: number) => pipe(this.#rooms, get(id));
}
