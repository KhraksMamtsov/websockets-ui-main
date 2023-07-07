import { endpoint } from "./controller";
import * as tg from "../lib/typeGuard";
import { pipe } from "../lib/functions";
import * as E from "../lib/either";
import * as ErrAnsw from "./answers/error.answer";
import * as RA from "../lib/readonlyArray";
import * as O from "../lib/option";
import { updateRoomsAnswer } from "./answers/updateRoom.answer";
import { createGameAnswer } from "./answers/createGame.answer";
export const addUserToRoomEndpoint = endpoint(
  "add_user_to_room",
  tg.shape({
    indexRoom: tg.number(),
  }),
  ({ data: { indexRoom } }) =>
    ({ ws, userDb, roomDb, wss, gameDb }) => {
      pipe(
        userDb.getByWebSocket(ws),
        E.fromOption(() => ErrAnsw.unAuth),
        E.chain((user) =>
          pipe(
            roomDb.getAll(),
            RA.findFirst((x) => x.player.id === user.id),
            O.map(ErrAnsw.alreadyInRoom),
            E.fromOption(() =>
              pipe(
                roomDb.getById(indexRoom),
                E.fromOption(() => ErrAnsw.roomNotFound(indexRoom)),
                E.map((openedRoom) => {
                  return {
                    deleteOpenRoom: () => roomDb.deleteById(openedRoom.id),
                    startPendingGame: () =>
                      gameDb.createPending({
                        left: openedRoom.player,
                        right: user,
                      }),
                  };
                })
              )
            ),
            E.swap,
            E.flatten
          )
        ),
        E.match(
          (error) => ws.send(error),
          (success) => {
            const updatedOpenRooms = success.deleteOpenRoom();

            wss.clients.forEach((client) =>
              client.send(updateRoomsAnswer(updatedOpenRooms))
            );
            const game = success.startPendingGame();
            const {
              left: { player: playerL },
              right: { player: playerR },
            } = game;

            playerL.ws.send(createGameAnswer({ game, player: playerL }));
            playerR.ws.send(createGameAnswer({ game, player: playerR }));
          }
        )
      );
    }
);
