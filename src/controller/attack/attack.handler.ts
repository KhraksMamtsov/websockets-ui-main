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
import { isMiss } from "../../entity/attackResult";
import { updateWinnersAnswer } from "../answers/updateWinners.answer";
import { finishAnswer } from "../answers/finish.answer";
import type { Coords } from "../../entity/coords";
import type { Board } from "../../entity/board";

export const attackHandler =
  (getAttackCoords?: (board: Board) => Coords) =>
  (command: Pick<ParsedCommand<"attack", typeof attackTg>, "data">) =>
  ({ userDb, ws, wss, gameDb, winnersDb }: HandlerDeps) => {
    pipe(
      userDb.getByWebSocket(ws),
      E.fromOption(() => ErrAnsw.unAuth),
      E.bindTo("user"),
      E.bind("game", ({ user }) =>
        pipe(
          gameDb.getActiveById(command.data.gameId),
          E.fromOption(() => noActiveGameWithUser(user))
        )
      ),
      E.chain((x) =>
        G.isPlayerTurn(x.user)(x.game) ? E.right(x) : E.left(wrongTurn())
      ),
      E.map((x) => {
        const enemy = G.getEnemySide(x.user)(x.game);

        const attackCoords = getAttackCoords?.(enemy.board) ?? {
          x: command.data.x,
          y: command.data.y,
        };

        pipe(
          enemy.board,
          B.attack(attackCoords),
          ({ newBoard, attackResults }) => {
            enemy.board = newBoard;

            let newGame = x.game;

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
              G.players(x.game).forEach((p) =>
                p.ws.send(turnAnswer({ playerId: x.user.id }))
              );
            } else {
              realAttacks.forEach((ar) => {
                G.players(x.game).forEach((player) =>
                  player.ws.send(
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
                    const winners = winnersDb.writeWinner(winner).getAll();

                    G.players(x.game).forEach((p) =>
                      p.ws.send(finishAnswer({ player: winner }))
                    );

                    wss.clients.forEach((client) =>
                      client.send(updateWinnersAnswer(winners))
                    );
                  }
                )
              );

              if (realAttacks.every(isMiss)) {
                newGame = G.toggleTurn(newGame);
                G.players(x.game).forEach((p) =>
                  p.ws.send(turnAnswer({ playerId: enemy.player.id }))
                );
              } else {
                G.players(x.game).forEach((p) =>
                  p.ws.send(turnAnswer({ playerId: x.user.id }))
                );
              }

              gameDb.updateActive(newGame);
            }
          }
        );
      }),

      E.match(
        (x) => ws.send(x),
        () => {}
      )
    );
  };
