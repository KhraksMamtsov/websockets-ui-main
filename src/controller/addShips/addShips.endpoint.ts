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
          (err) => {
            ws.send(err);
          },
          G.match(
            //
            gameDb.updatePending,
            (activeGame) => {
              gameDb.createActive(activeGame);

              activeGame.left.player.ws.send("null");
              activeGame.right.player.ws.send("null");
            }
          )
        )
      );
    }
);

// const qwe = {
//   type: "error",
//   data: {
//     message:
//       "Invalid board configuration [{position:{x:0,y:2},direction:false,type:huge,length:4},{position:{x:2,y:6},direction:true,type:large,length:3},{position:{x:6,y:3},direction:false,type:large,length:3},{position:{x:7,y:1},direction:false,type:medium,length:2},{position:{x:7,y:5},direction:false,type:medium,length:2},{position:{x:7,y:7},direction:true,type:medium,length:2},{position:{x:5,y:1},direction:false,type:small,length:1},{position:{x:5,y:8},direction:true,type:small,length:1},{position:{x:2,y:0},direction:false,type:small,length:1},{position:{x:2,y:4},direction:true,type:small,length:1}]\\n error: Wrong count of large ships: expected undefined but got 2",
//   },
// };
