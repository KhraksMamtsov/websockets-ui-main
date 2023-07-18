import { endpoint } from "./controller";
import * as tg from "../lib/typeGuard";
import { pipe } from "../lib/functions";
import * as E from "../lib/either";
import { unAuth, alreadyInRoom } from "./answers/error.answer";
import * as RA from "../lib/readonlyArray";
import { updateRoomsAnswer } from "./answers/updateRoom.answer";

export const createRoomEndpoint = endpoint(
  "create_room",
  tg.null,
  () =>
    ({ answer, userDb, roomDb, broadcast }) => {
      pipe(
        userDb.getByConnectionId(answer),
        E.fromOption(() => unAuth),
        E.chain((u) =>
          pipe(
            roomDb.getAll(),
            RA.findFirst((x) => x.player.id === u.id),
            E.fromOption(() => roomDb.create(u)),
            E.map(alreadyInRoom),
            E.swap
          )
        ),
        E.match(
          (error) => answer(error),
          (updatedRooms) => broadcast(updateRoomsAnswer(updatedRooms))
        )
      );
    }
);
