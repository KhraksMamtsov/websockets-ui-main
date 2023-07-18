import type { User } from "./user";
import * as B from "./board";
import * as O from "../lib/option";
import * as RA from "../lib/readonlyArray";
import { flow, pipe } from "../lib/functions";
import * as E from "../lib/either";

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

export interface SinglePendingGame {
  tag: "SinglePendingGame";
  id: number;
  player: {
    player: User;
  };
}

export interface SingleActiveGame {
  tag: "SingleActiveGame";
  id: number;
  turn: "player" | "bot";
  player: {
    player: User;
    board: B.Board;
  };
  bot: B.Board;
}

export type LiveGame = ActiveGame | PendingGame;
export type SingleGame = SingleActiveGame | SinglePendingGame;
export type Game = LiveGame | SingleGame;

const botShipsDTO = [
  { position: { x: 6, y: 5 }, direction: true, type: "huge", length: 4 },
  { position: { x: 6, y: 0 }, direction: true, type: "large", length: 3 },
  { position: { x: 8, y: 4 }, direction: true, type: "large", length: 3 },
  { position: { x: 1, y: 7 }, direction: false, type: "medium", length: 2 },
  { position: { x: 0, y: 1 }, direction: true, type: "medium", length: 2 },
  { position: { x: 2, y: 3 }, direction: true, type: "medium", length: 2 },
  { position: { x: 4, y: 3 }, direction: false, type: "small", length: 1 },
  { position: { x: 2, y: 0 }, direction: true, type: "small", length: 1 },
  { position: { x: 3, y: 9 }, direction: true, type: "small", length: 1 },
  { position: { x: 4, y: 6 }, direction: false, type: "small", length: 1 },
] as const;
export const singleActive = (args: {
  id: number;
  player: User;
  board: B.Board;
}): SingleActiveGame => ({
  tag: "SingleActiveGame",
  id: args.id,
  turn: "player",
  player: {
    player: args.player,
    board: args.board,
  },
  bot: {
    domain: {
      firedCells: [],
      ships: (B.fromDto(botShipsDTO) as E.Right<B.Board>).right.domain.ships,
    },
    dto: botShipsDTO,
  },
});

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

export const singlePending = (args: {
  id: number;
  player: User;
}): SinglePendingGame => ({
  tag: "SinglePendingGame",
  id: args.id,
  player: { player: args.player },
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

export const getSingleWinner = (game: SingleActiveGame) => {
  return pipe(
    game.bot,
    O.fromPredicate(B.isKilled),
    O.map(() => "bot" as const),
    O.alt(() =>
      pipe(
        game.player.board,
        O.fromPredicate(B.isKilled),
        O.map(() => game.player.player)
      )
    )
  );
};

export const setPlayersBoard =
  (args: { player: User; board: B.Board }) =>
  (pendingGame: PendingGame): LiveGame => {
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

export const setSinglePlayerBoard =
  (args: { board: B.Board }) =>
  (pendingGame: SinglePendingGame): SingleActiveGame => {
    return singleActive({
      board: args.board,
      player: pendingGame.player.player,
      id: pendingGame.id,
    });
  };

export const isWithPlayer = (player: User) => {
  return matchLive(
    (singleGame) => singleGame.player.player.id === player.id,
    (liveGame) =>
      [liveGame.left.player.id, liveGame.right.player.id].includes(player.id)
  );
};

export const matchLive =
  <L, S, LG extends LiveGame, SG extends SingleGame>(
    onSingle: (singleGame: SG) => S,
    onLive: (pendingGame: LG) => L
  ) =>
  (game: SG | LG): L | S =>
    game.tag === "SinglePendingGame" || game.tag === "SingleActiveGame"
      ? onSingle(game as SG)
      : onLive(game as LG);

export const match =
  <P, A>(
    onPending: (pendingGame: PendingGame) => P,
    onActive: (activeGame: ActiveGame) => A
  ) =>
  (game: LiveGame): P | A =>
    game.tag === "PendingGame" ? onPending(game) : onActive(game);

export const matchActive =
  <P, A>(
    onSingleActive: (singleActiveGame: SingleActiveGame) => P,
    onLiveActive: (liveActiveGame: ActiveGame) => A
  ) =>
  (game: ActiveGame | SingleActiveGame): P | A =>
    game.tag === "SingleActiveGame" ? onSingleActive(game) : onLiveActive(game);

export const getEnemySide =
  (player: User) =>
  <G extends LiveGame>(game: G): G["left" | "right"] =>
    game.left.player.id === player.id ? game.right : game.left;

export const isPlayerTurn = (player: User) => {
  return (game: ActiveGame): boolean => {
    return game[game.turn].player.id === player.id;
  };
};
export const getPlayersSide =
  (player: User) =>
  <G extends LiveGame>(game: G): G["left" | "right"] =>
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
