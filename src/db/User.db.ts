import { pipe } from "../lib/functions";
import * as M from "../lib/map";
import type { User } from "../entity/user";
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
  getByConnectionId = (connectionId: (message: string) => void) =>
    pipe(
      [...this.#users],
      RA.findFirst(([_, u]) => u.connectionId === connectionId),
      O.map(([_, u]) => u)
    );

  create = (userData: {
    password: string;
    name: string;
    answer: (message: string) => void;
  }) => {
    const newUser: User = {
      name: userData.name,
      password: userData.password,
      connectionId: userData.answer,
      answer: userData.answer,
      id: this.#currentIndex,
    };
    this.#currentIndex++;

    this.#users.set(newUser.name, newUser);

    return newUser;
  };

  updateOrCreate = (userData: {
    password: string;
    name: string;
    answer: (message: string) => void;
  }) => {
    const newUser = pipe(
      this.getByName(userData.name),
      O.map((user) => {
        return { ...user, connectionId: userData.answer } as User;
      }),
      O.get(() => {
        const newUser: User = {
          name: userData.name,
          password: userData.password,
          connectionId: userData.answer,
          answer: userData.answer,
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
