import { endpoint } from "./controller";
import * as tg from "../lib/typeGuard";
import { pipe } from "../lib/functions";
import * as E from "../lib/either";
import * as ErrAnsw from "./answers/error.answer";
import { createGameAnswer } from "./answers/createGame.answer";

export const singlePlayEndpoint = endpoint(
  "single_play",
  tg.null,
  () =>
    ({ userDb, answer, gameDb }) => {
      pipe(
        userDb.getByConnectionId(answer),
        E.fromOption(() => ErrAnsw.unAuth),
        E.bindTo("user"),
        E.bind("game", ({ user }) => E.right(gameDb.createSinglePending(user))),
        E.match(answer, (x) => {
          answer(
            createGameAnswer({
              game: x.game,
              player: x.user,
            })
          );
        })
      );
    }
);
