import { answer } from "./answer";
import type { OpenRoom } from "../../entity/openRoom";

export const updateRoomsAnswer = (rooms: ReadonlyArray<OpenRoom>) =>
  answer("update_room")(
    rooms.map((r) => ({
      roomId: r.id,
      roomUsers: [
        {
          name: r.player.name,
          index: r.player.id,
        },
      ],
    }))
  );
