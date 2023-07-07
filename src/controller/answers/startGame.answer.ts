// {
//     type: "start_game",
//         data:
//     {
//         ships:
//             [
//                 {
//                     position: {
//                         x: <number>,
//                         y: <number>,
//                     },
//                     direction: <boolean>,
//                     length: <number>,
//                     type: "small"|"medium"|"large"|"huge",
//                 }
//             ],
//                 currentPlayerIndex: <number>,
//     },
//     id: 0,
// }

import { answer } from "./answer";
import type { Board } from "../../entity/board";

export const startGameAnswer = (args: {
  board: Board;
  currentPlayerIndex: number;
}) =>
  answer("start_game")({
    ships: args.board.dto,
    currentPlayerIndex: args.currentPlayerIndex,
  });
