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
    ({ userDb, answer, gameDb }) => {
      pipe(
        userDb.getByConnectionId(answer),
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
        E.map((x) => {
          if (x.game.tag === "PendingGame") {
            return G.setPlayersBoard({
              player: x.user,
              board: x.board,
            })(x.game);
          } else {
            return G.setSinglePlayerBoard({
              board: x.board,
            })(x.game);
          }
        }),
        E.match(
          answer,
          G.matchLive(
            (singleGame: G.SingleActiveGame) => {
              gameDb.createSingleActive(singleGame);
              const currentPlayerIndex = singleGame.player.player.id;

              answer(
                startGameAnswer({
                  board: singleGame.player.board,
                  currentPlayerIndex,
                })
              );
              answer(
                turnAnswer({
                  playerId: currentPlayerIndex,
                })
              );
            },
            G.match(
              (x) => gameDb.updatePending(x),
              (activeGame) => {
                gameDb.createActive(activeGame);

                const currentPlayerIndex =
                  activeGame[activeGame.turn].player.id;

                G.sides(activeGame).forEach((side) => {
                  side.player.answer(
                    startGameAnswer({
                      board: side.board,
                      currentPlayerIndex,
                    })
                  );
                });

                G.players(activeGame).forEach((player) => {
                  player.answer(
                    turnAnswer({
                      playerId: currentPlayerIndex,
                    })
                  );
                });
              }
            )
          )
        )
      );
    }
);
