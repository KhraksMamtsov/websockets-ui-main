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

  create = (userData: { password: string; name: string; ws: WebSocket }) => {
    const newUser: User = {
      name: userData.name,
      password: userData.password,
      ws: userData.ws,
      id: this.#currentIndex,
    };
    this.#currentIndex++;

    this.#users.set(newUser.name, newUser);

    return newUser;
  };

  updateOrCreate = (userData: {
    password: string;
    name: string;
    ws: WebSocket;
  }) => {
    const newUser = pipe(
      this.getByName(userData.name),
      O.map((user) => {
        return { ...user, ws: userData.ws } as User;
      }),
      O.get(() => {
        const newUser: User = {
          name: userData.name,
          password: userData.password,
          ws: userData.ws,
          id: this.#currentIndex,
        };
        this.#currentIndex++;
        return newUser;
      })
    );

    this.#users.set(newUser.name, newUser);

    return newUser;
  };
}
