// {
//     type: "add_ships",
//         data:
//     {
//         gameId: <number>,
//             ships:
//         [
//             {
//                 position: {
//                     x: <number>,
//                     y: <number>,
//                 },
//                 direction: <boolean>,
//                 length: <number>,
//                 type: "small"|"medium"|"large"|"huge",
//             }
//         ],
//             indexPlayer: <number>,
//     },
//     id: 0,
// }
import { endpoint } from "../controller";
import * as tg from "../../lib/typeGuard";
import { shipsTg } from "./ships.dto";

export const addShipsEndpoint = endpoint(
  "add_ships",
  tg.shape({
    gameId: tg.number(),
    ships: shipsTg,
  }),
  (command) =>
    ({}) => {}
);
