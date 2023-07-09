import { endpoint } from "../controller";
import * as tg from "../../lib/typeGuard";
import { boardTg } from "./boardDto";
import { pipe } from "../../lib/functions";
import * as E from "../../lib/either";
import * as ErrAnsw from "../answers/error.answer";
import {
  invalidBoardConfiguration,
  noPendingGameWithUser,
} from "../answers/error.answer";
import * as G from "../../entity/game";
import * as B from "../../entity/board";
import { startGameAnswer } from "../answers/startGame.answer";
import { turnAnswer } from "../answers/turn.answer";

export const addShipsEndpoint = endpoint(
  "add_ships",
  tg.shape({
    gameId: tg.number(),
    indexPlayer: tg.number(),
    ships: boardTg,
  }),
  (command) =>
    ({ userDb, ws, gameDb }) => {
      pipe(
        userDb.getByWebSocket(ws),
        E.fromOption(() => ErrAnsw.unAuth),
        E.bindTo("user"),
        E.bind("game", ({ user }) =>
          pipe(
            gameDb.getPendingByPlayer(user),
            E.fromOption(() => noPendingGameWithUser(user))
          )
        ),
        E.bind("board", () =>
          pipe(
            command.data.ships,
            B.fromDto,
            E.mapLeft((x) => invalidBoardConfiguration(command.data.ships, x))
          )
        ),
        E.map((x) =>
          pipe(
            x.game,
            G.setPlayersBoard({
              player: x.user,
              board: x.board,
            })
          )
        ),
        E.match(
          (err) => ws.send(err),
          G.match(gameDb.updatePending, (activeGame) => {
            gameDb.createActive(activeGame);

            const currentPlayerIndex = activeGame[activeGame.turn].player.id;

            G.sides(activeGame).forEach((side) => {
              side.player.ws.send(
                startGameAnswer({
                  board: side.board,
                  currentPlayerIndex,
                })
              );
            });

            G.players(activeGame).forEach((player) => {
              player.ws.send(
                turnAnswer({
                  playerId: currentPlayerIndex,
                })
              );
            });
          })
        )
      );
    }
);
