import { flow, pipe } from "../lib/functions";
import * as O from "../lib/option";
import type { UserDb } from "../db/User.db";
import type { GameDb } from "../db/Game.db";
import type { WebSocket, WebSocketServer } from "ws";
import { getEnemy } from "../entity/game";
import { finishAnswer } from "./answers/finish.answer";
import { updateWinnersAnswer } from "./answers/updateWinners.answer";
import type { WinnerDb } from "../db/WinnerDb";
import { OpenRoomDb } from "../db/OpenRoomDb";
import { updateRoomsAnswer } from "./answers/updateRoom.answer";

type Deps = {
  userDb: UserDb;
  gameDb: GameDb;
  winnersDb: WinnerDb;
  roomDb: OpenRoomDb;
  ws: WebSocket;
  wss: WebSocketServer;
};
export const closeConnection = ({
  ws,
  userDb,
  gameDb,
  wss,
  roomDb,
  winnersDb,
}: Deps) => {
  pipe(
    O.Do,
    O.bind("user", () => userDb.getByWebSocket(ws)),
    O.tap(
      flow(
        (x) => x.user,
        roomDb.deleteByOwner,
        O.tap((newRooms) => {
          wss.clients.forEach((c) => c.send(updateRoomsAnswer(newRooms)));
        })
      )
    ),
    O.bind("game", ({ user }) => gameDb.getActiveByPlayer(user)),
    O.map(({ user, game }) => {
      const enemy = getEnemy(user)(game);

      const winners = winnersDb.writeWinner(enemy).getAll();

      enemy.ws.send(finishAnswer({ player: enemy }));

      wss.clients.forEach((client) =>
        client.send(updateWinnersAnswer(winners))
      );
    })
  );
};
