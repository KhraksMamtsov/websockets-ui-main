import { WebSocketServer } from "ws";
import { createController } from "../controller/controller";
import { regEndpoint } from "../controller/reg/reg.endpoint";
import { createRoomEndpoint } from "../controller/createRoom.endpoint";
import { UserDb } from "../db/User.db";
import { WinnerDb } from "../db/WinnerDb";
import { OpenRoomDb } from "../db/OpenRoomDb";
import { addUserToRoomEndpoint } from "../controller/addUserToRoom";
import { GameDb } from "../db/Game.db";
import { addShipsEndpoint } from "../controller/addShips/addShips.endpoint";

const serverParameters = { port: 3000, host: "localhost" };
const wss = new WebSocketServer(serverParameters, () => {
  console.log(
    `WebSocketServer started at ws://${serverParameters.host}:${serverParameters.port}`
  );
});

const userDb = new UserDb();
const winnersDb = new WinnerDb();
const roomDb = new OpenRoomDb();
const gameDb = new GameDb();

const controller = createController([
  regEndpoint,
  createRoomEndpoint,
  addUserToRoomEndpoint,
  addShipsEndpoint,
] as any);

wss.on("error", console.error);

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      controller(data)({ ws, wss, userDb, winnersDb, roomDb, gameDb });
    }
  });
});
wss.on("close", console.log);
