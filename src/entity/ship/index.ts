import * as tg from "../../lib/typeGuard";
import * as RA from "../../lib/readonlyArray";
import { smallShipTg } from "./tg/small.ship";
import { mediumShipTg } from "./tg/medium.ship";
import { largeShipTg } from "./tg/large.ship";
import { hugeShipTg } from "./tg/huge.ship";
import type { Ship } from "./shipBase";
import { attack, isKilled } from "./shipBase";
import { unbroken } from "./deck";
export type { Ship };
export { Type } from "./type";
export { attack, isKilled };

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
