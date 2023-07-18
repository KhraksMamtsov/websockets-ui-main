import { flow, pipe } from "../lib/functions";
import * as O from "../lib/option";
import type { UserDb } from "../db/User.db";
import type { GameDb } from "../db/Game.db";
import { getEnemy } from "../entity/game";
import { finishAnswer } from "./answers/finish.answer";
import { updateWinnersAnswer } from "./answers/updateWinners.answer";
import type { WinnerDb } from "../db/WinnerDb";
import { OpenRoomDb } from "../db/OpenRoomDb";
import { updateRoomsAnswer } from "./answers/updateRoom.answer";

type Deps = {
  userDb: UserDb;
  gameDb: GameDb;
  broadcast: (message: string) => void;
  answer: (message: string) => void;
  winnersDb: WinnerDb;
  roomDb: OpenRoomDb;
};
export const closeConnection = ({
  answer,
  userDb,
  gameDb,
  roomDb,
  broadcast,
  winnersDb,
}: Deps) => {
  pipe(
    O.Do,
    O.bind("user", () => userDb.getByConnectionId(answer)),
    O.tap(
      flow(
        (x) => x.user,
        roomDb.deleteByOwner,
        O.tap((newRooms) => broadcast(updateRoomsAnswer(newRooms)))
      )
    ),
    O.bind("game", ({ user }) => gameDb.getActiveByPlayer(user)),
    O.map(({ user, game }) => {
      const enemy = getEnemy(user)(game);

      const winners = winnersDb.writeWinner(enemy).getAll();

      enemy.answer(finishAnswer({ player: enemy }));
      broadcast(updateWinnersAnswer(winners));
    })
  );
};
