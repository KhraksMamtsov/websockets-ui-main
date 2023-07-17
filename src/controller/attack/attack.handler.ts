import type { HandlerDeps, ParsedCommand } from "../controller";
import { attackTg } from "./attack.tg";
import { pipe } from "../../lib/functions";
import * as O from "../../lib/option";
import * as E from "../../lib/either";
import * as ErrAnsw from "../answers/error.answer";
import { noActiveGameWithUser, wrongTurn } from "../answers/error.answer";
import * as G from "../../entity/game";
import * as B from "../../entity/board";
import * as RA from "../../lib/readonlyArray";
import * as AR from "../../entity/attackResult";
import { turnAnswer } from "../answers/turn.answer";
import { attackAnswer } from "../answers/attack.answer";
import { AttackResultType, isMiss } from "../../entity/attackResult";
import { updateWinnersAnswer } from "../answers/updateWinners.answer";
import { finishAnswer } from "../answers/finish.answer";
import type { Coords } from "../../entity/coords";
import type { Board } from "../../entity/board";
import { randomInt } from "../../lib/random";
import * as C from "../../entity/coords";

export const attackHandler =
  (getAttackCoords?: (board: Board) => Coords) =>
  (command: Pick<ParsedCommand<"attack", typeof attackTg>, "data">) =>
  ({ userDb, answer, broadcast, gameDb, winnersDb }: HandlerDeps) => {
    pipe(
      userDb.getByConnectionId(answer),
      E.fromOption(() => ErrAnsw.unAuth),
      E.bindTo("user"),
      E.bind("game", ({ user }) =>
        pipe(
          gameDb.getActiveById(command.data.gameId),
          E.fromOption(() => noActiveGameWithUser(user))
        )
      ),
      E.chain((x) =>
        pipe(
          x.game,
          G.matchActive(
            () => E.right(x),
            (g) =>
              G.isPlayerTurn(x.user)(g) ? E.right(x) : E.left(wrongTurn())
          )
        )
      ),
      E.map((x) =>
        pipe(
          x.game,
          G.matchActive(
            (singleActiveGame) => {
              const attackCoords = getAttackCoords?.(singleActiveGame.bot) ?? {
                x: command.data.x,
                y: command.data.y,
              };

              pipe(
                singleActiveGame.bot,
                B.attack(attackCoords),
                ({ newBoard, attackResults }) => {
                  singleActiveGame.bot = newBoard;

                  let newGame = singleActiveGame;

                  const [realAttacks, doubles] = pipe(
                    attackResults,
                    RA.map(
                      E.fromPredicate(
                        AR.isDouble,
                        (x) => x as AR.Shot | AR.Killed | AR.Miss
                      )
                    ),
                    RA.partition
                  );

                  if (doubles.length > 0) {
                    answer(turnAnswer({ playerId: x.user.id }));
                  } else {
                    realAttacks.forEach((ar) => {
                      answer(
                        attackAnswer({
                          attackResult: ar,
                          currentPlayer: x.user,
                        })
                      );
                    });

                    pipe(
                      newGame,
                      G.getSingleWinner,
                      O.match(
                        () => {},
                        (winner) => {
                          if (winner === "bot") {
                            return;
                          }
                          const winners = winnersDb
                            .writeWinner(winner)
                            .getAll();

                          answer(finishAnswer({ player: winner }));

                          broadcast(updateWinnersAnswer(winners));
                        }
                      )
                    );

                    if (realAttacks.every(isMiss)) {
                      const emptyCells = B.getEmptyCoords(
                        singleActiveGame.player.board
                      );

                      const randomIndex = randomInt(0, emptyCells.length - 1);
                      const coords =
                        emptyCells.length > 0
                          ? emptyCells[randomIndex]!
                          : C.random();

                      answer(
                        attackAnswer({
                          attackResult: {
                            type: AttackResultType.MISS,
                            coords,
                          },
                          currentPlayer: { id: -1 } as any,
                        })
                      );

                      answer(turnAnswer({ playerId: x.user.id }));
                    } else {
                      answer(turnAnswer({ playerId: x.user.id }));
                    }

                    gameDb.updateSingleActive(newGame);
                  }
                }
              );
            },
            (liveActiveGame) => {
              const enemy = G.getEnemySide(x.user)(liveActiveGame);

              const attackCoords = getAttackCoords?.(enemy.board) ?? {
                x: command.data.x,
                y: command.data.y,
              };

              pipe(
                enemy.board,
                B.attack(attackCoords),
                ({ newBoard, attackResults }) => {
                  enemy.board = newBoard;

                  let newGame = liveActiveGame;

                  const [realAttacks, doubles] = pipe(
                    attackResults,
                    RA.map(
                      E.fromPredicate(
                        AR.isDouble,
                        (x) => x as AR.Shot | AR.Killed | AR.Miss
                      )
                    ),
                    RA.partition
                  );

                  if (doubles.length > 0) {
                    G.players(liveActiveGame).forEach((p) =>
                      p.answer(turnAnswer({ playerId: x.user.id }))
                    );
                  } else {
                    realAttacks.forEach((ar) => {
                      G.players(liveActiveGame).forEach((player) =>
                        player.answer(
                          attackAnswer({
                            attackResult: ar,
                            currentPlayer: x.user,
                          })
                        )
                      );
                    });

                    pipe(
                      newGame,
                      G.getWinner,
                      O.match(
                        () => {},
                        (winner) => {
                          const winners = winnersDb
                            .writeWinner(winner)
                            .getAll();

                          G.players(liveActiveGame).forEach((p) =>
                            p.answer(finishAnswer({ player: winner }))
                          );

                          broadcast(updateWinnersAnswer(winners));
                        }
                      )
                    );

                    if (realAttacks.every(isMiss)) {
                      newGame = G.toggleTurn(newGame);
                      G.players(liveActiveGame).forEach((p) =>
                        p.answer(turnAnswer({ playerId: enemy.player.id }))
                      );
                    } else {
                      G.players(liveActiveGame).forEach((p) =>
                        p.answer(turnAnswer({ playerId: x.user.id }))
                      );
                    }

                    gameDb.updateActive(newGame);
                  }
                }
              );
            }
          )
        )
      ),
      E.match(
        (x) => answer(x),
        () => {}
      )
    );
  };
