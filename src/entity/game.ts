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

export const createActive = (args: {
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
}): ActiveGame => ({
  tag: "ActiveGame",
  turn: args.turn,
  id: args.id,
  left: args.left,
  right: args.right,
});

export const setPlayersBoard =
  (args: { player: User; board: Board }) =>
  (pendingGame: PendingGame): Game => {
    const game = pendingGame;

    if (pendingGame.left.player.id === args.player.id) {
      game.left.board = O.some(args.board);
    } else {
      game.right.board = O.some(args.board);
    }

    if (O.isSome(game.left.board) && O.isSome(game.right.board)) {
      return createActive({
        turn: "left",
        id: game.id,
        left: {
          player: game.left.player,
          board: game.left.board.value,
        },
        right: {
          player: game.right.player,
          board: game.right.board.value,
        },
      });
    } else {
      return game;
    }
  };

export const isWithPlayer = (player: User) => {
  return (game: Game) =>
    [game.left.player.id, game.right.player.id].includes(player.id);
};

export const match =
  <P, A>(
    onPending: (pendingGame: PendingGame) => P,
    onActive: (activeGame: ActiveGame) => A
  ) =>
  (game: Game): P | A =>
    game.tag === "PendingGame" ? onPending(game) : onActive(game);

export const getOppositePlayer = (player: User) => (game: Game) =>
  game.left.player.id === player.id ? game.right.player : game.left.player;

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
