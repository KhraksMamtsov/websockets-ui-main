import * as tg from "../../lib/typeGuard";
import * as RA from "../../lib/readonlyArray";
import { smallShipTg } from "./small.ship";
import { mediumShipTg } from "./medium.ship";
import { largeShipTg } from "./large.ship";
import { hugeShipTg } from "./huge.ship";
import type { Ship } from "./shipBase";
import { attack, isKilled } from "./shipBase";
import { unbroken } from "./deck";
export type { Ship };
export { Type } from "./type";
export { attack, isKilled };

// const asd = {
//   type: "add_ships",
//   data: {
//     gameId: 0,
//     ships: [
//       { position: { x: 7, y: 4 }, direction: true, type: "huge", length: 4 },
//       { position: { x: 8, y: 0 }, direction: true, type: "large", length: 3 },
//       { position: { x: 3, y: 1 }, direction: false, type: "large", length: 3 },
//       { position: { x: 1, y: 9 }, direction: false, type: "medium", length: 2 },
//       { position: { x: 0, y: 1 }, direction: false, type: "medium", length: 2 },
//       { position: { x: 3, y: 4 }, direction: true, type: "medium", length: 2 },
//       { position: { x: 1, y: 5 }, direction: true, type: "small", length: 1 },
//       { position: { x: 8, y: 9 }, direction: true, type: "small", length: 1 },
//       { position: { x: 6, y: 9 }, direction: true, type: "small", length: 1 },
//       { position: { x: 2, y: 7 }, direction: false, type: "small", length: 1 },
//     ],
//     indexPlayer: 0,
//   },
//   id: 0,
// };

export const shipTg = tg.union([
  smallShipTg,
  mediumShipTg,
  largeShipTg,
  hugeShipTg,
]);

export type ShipDto = tg.Infer<typeof shipTg>;

export function fromDto(dto: ShipDto): Ship {
  const decksNumbers = RA.range([0, dto.length]);

  const decksPositions = dto.direction
    ? decksNumbers.map((dn) => ({
        x: dto.position.x,
        y: dto.position.y + dn,
      }))
    : decksNumbers.map((dn) => ({
        x: dto.position.x + dn,
        y: dto.position.y,
      }));

  return {
    type: dto.type,
    decks: decksPositions.map((dp) => unbroken(dp)),
  };
}
