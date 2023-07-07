import type { User } from "./user";
import type { Board } from "./board";
import * as O from "../lib/option";

export interface ActiveGame {
  tag: "ActiveGame";
  id: number;
  turn: "left" | "right";
  left: {
    player: User;
    board: Board;
  };
  right: {
    player: User;
    board: Board;
  };
}

export interface PendingGame {
  tag: "PendingGame";
  id: number;
  left: {
    player: User;
    board: O.Option<Board>;
  };
  right: {
    player: User;
    board: O.Option<Board>;
  };
}

export type Game = ActiveGame | PendingGame;

export const createPending = (args: {
  id: number;
  left: User;
  right: User;
}): PendingGame => ({
  tag: "PendingGame",
  id: args.id,
  left: {
    player: args.left,
    board: O.none,
  },
  right: {
    player: args.right,
    board: O.none,
  },
});
