import type { HandlerDeps, ParsedCommand } from "../controller";
import { attackTg } from "./attack.tg";
import { pipe } from "../../lib/functions";
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

export const attackHandler =
  (command: Pick<ParsedCommand<"attack", typeof attackTg>, "data">) =>
  ({ userDb, ws, gameDb }: HandlerDeps) => {
    pipe(
      userDb.getByWebSocket(ws),
      E.fromOption(() => ErrAnsw.unAuth),
      E.bindTo("user"),
      E.bind("game", ({ user }) =>
        pipe(
          gameDb.getActiveByPlayer(user),
          E.fromOption(() => noActiveGameWithUser(user))
        )
      ),
      E.chain((x) =>
        G.isPlayerTurn(x.user)(x.game) ? E.right(x) : E.left(wrongTurn())
      ),
      E.map((x) => {
        const enemy = G.getEnemySide(x.user)(x.game);

        pipe(
          enemy.board,
          B.attack({
            x: command.data.x,
            y: command.data.y,
          }),
          ({ newBoard, attackResults }) => {
            enemy.board = newBoard;

            const newGame = G.toggleTurn(x.game);

            gameDb.updateActive(newGame);

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

              if (!realAttacks.some(isMiss)) {
                G.players(x.game).forEach((p) =>
                  p.ws.send(turnAnswer({ playerId: enemy.player.id }))
                );
              }
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
