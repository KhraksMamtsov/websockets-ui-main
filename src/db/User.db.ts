import { pipe } from "../lib/functions";
import * as M from "../lib/map";
import type { User } from "../entity/user";
import type WebSocket from "ws";
import * as RA from "../lib/readonlyArray";
import * as O from "../lib/option";

export class UserDb {
  #currentIndex = 0;
  #users = new Map<string, User>();

  getAll = () => [...this.#users.values()];

  getByName = (name: string) => pipe(this.#users, M.get(name));
  getById = (id: number) =>
    pipe(
      this.getAll(),
      RA.findFirst((user) => user.id === id)
    );
  getByWebSocket = (ws: WebSocket) =>
    pipe(
      [...this.#users],
      RA.findFirst(([_, u]) => u.ws === ws),
      O.map(([_, u]) => u)
    );

  write = (user: { password: string; name: string; ws: WebSocket }) => {
    const newUser: User = {
      name: user.name,
      password: user.password,
      ws: user.ws,
      id: this.#currentIndex,
    };
    this.#users.set(user.name, newUser);

    this.#currentIndex++;

    return newUser;
  };
}
