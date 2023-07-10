import type { User } from "./user";
import * as B from "./board";
import * as O from "../lib/option";
import * as RA from "../lib/readonlyArray";
import { flow, pipe } from "../lib/functions";

export interface ActiveGame {
  tag: "ActiveGame";
  id: number;
  turn: "left" | "right";
  left: {
    player: User;
    board: B.Board;
  };
  right: {
    player: User;
    board: B.Board;
  };
}

export interface PendingGame {
  tag: "PendingGame";
  id: number;
  left: {
    player: User;
    board: O.Option<B.Board>;
  };
  right: {
    player: User;
    board: O.Option<B.Board>;
  };
}

export type Game = ActiveGame | PendingGame;

export const active = (args: {
  id: number;
  turn: "left" | "right";
  left: {
    player: User;
    board: B.Board;
  };
  right: {
    player: User;
    board: B.Board;
  };
}): ActiveGame => ({
  tag: "ActiveGame",
  turn: args.turn,
  id: args.id,
  left: args.left,
  right: args.right,
});

export const pending = (args: {
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

export const toggleTurn = (activeGame: ActiveGame): ActiveGame => ({
  ...activeGame,
  turn: activeGame.turn === "left" ? "right" : "left",
});

export const getWinner = (game: ActiveGame) => {
  return pipe(
    game.right,
    O.fromPredicate((r) => B.isKilled(r.board)),
    O.map(() => game.left.player),
    O.alt(() =>
      pipe(
        game.left,
        O.fromPredicate((l) => B.isKilled(l.board)),
        O.map(() => game.right.player)
      )
    )
  );
};

export const setPlayersBoard =
  (args: { player: User; board: B.Board }) =>
  (pendingGame: PendingGame): Game => {
    const game = pendingGame;

    if (pendingGame.left.player.id === args.player.id) {
      game.left.board = O.some(args.board);
    } else {
      game.right.board = O.some(args.board);
    }

    if (O.isSome(game.left.board) && O.isSome(game.right.board)) {
      return active({
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

export const getEnemySide =
  (player: User) =>
  <G extends Game>(game: G): G["left" | "right"] =>
    game.left.player.id === player.id ? game.right : game.left;

export const isPlayerTurn = (player: User) => {
  return (game: ActiveGame): boolean => {
    return game[game.turn].player.id === player.id;
  };
};
export const getPlayersSide =
  (player: User) =>
  <G extends Game>(game: G): G["left" | "right"] =>
    game.left.player.id === player.id ? game.left : game.right;

export const players = (game: ActiveGame) => {
  return pipe(
    game,
    sides,
    RA.map((s) => s.player)
  );
};
export const sides = (game: ActiveGame) => {
  return [game.left, game.right];
};

export const getEnemy = (player: User) =>
  flow(getEnemySide(player), (x) => x.player);
