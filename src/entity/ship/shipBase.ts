import { Type } from "./type";
import * as O from "../../lib/option";
import { pipe } from "../../lib/functions";
import * as RA from "../../lib/readonlyArray";
import type { Coords } from "../coords";
import * as AR from "../attackResult";
import * as D from "./deck";
import { DeckState } from "./deck";

export interface Ship {
  type: Type;
  decks: D.Deck[];
}

export const isKilled = (ship: Ship) => pipe(ship.decks, RA.every(D.isBroken));

export const getBrokenDecks = (ship: Ship) =>
  pipe(
    ship.decks,
    RA.filter((d) => d.state === DeckState.BROKEN)
  );

export const attack =
  (attackCoords: Coords) =>
  (
    ship: Ship
  ): {
    newShip: Ship;
    attackResult: O.Option<AR.Shot | AR.Double | AR.Killed>;
  } => {
    return pipe(
      ship.decks,
      RA.reduce(
        (acc, deck) => {
          if (D.isWithCoords(attackCoords)(deck)) {
            const attackResult = D.isBroken(deck)
              ? AR.double(attackCoords)
              : AR.shot(attackCoords);
            return {
              decks: [...acc.decks, D.broken(deck.coords)],
              attackResult: O.some(attackResult),
            };
          } else {
            return {
              decks: [...acc.decks, deck],
              attackResult: acc.attackResult,
            };
          }
        },
        {
          decks: [] as D.Deck[],
          attackResult: O.none as O.Option<AR.Shot | AR.Double>,
        }
      ),
      (x) => {
        const newShip = { ...ship, decks: x.decks };

        const newAttackResult = pipe(
          x.attackResult,
          O.map((attackResult) => {
            if (AR.isShot(attackResult)) {
              if (newShip.decks.every(D.isBroken)) {
                return AR.killed(attackResult.coords);
              } else {
                return attackResult;
              }
            } else {
              return attackResult;
            }
          })
        );

        return {
          newShip,
          attackResult: newAttackResult,
        };
      }
    );
  };
