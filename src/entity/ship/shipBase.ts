import { Type } from "./type";
import * as O from "../../lib/option";
import { pipe } from "../../lib/functions";
import * as RA from "../../lib/readonlyArray";
import type { Coords } from "../coords";
import * as AR from "../attackResult";

type Deck = BrokenDeck | UnbrokenDeck;
type BrokenDeck = ReturnType<typeof brokenDeck>;
type UnbrokenDeck = ReturnType<typeof unbrokenDeck>;

export enum DeckState {
  BROKEN = "broken",
  UNBROKEN = "unbroken",
}

export const deck =
  <T extends DeckState>(state: T) =>
  (coords: Coords) =>
    ({
      ...coords,
      state,
    } as const);

export const brokenDeck = deck(DeckState.BROKEN);
export const isBrokenDeck = (deck: Deck): deck is BrokenDeck =>
  deck.state === DeckState.BROKEN;

export const unbrokenDeck = deck(DeckState.UNBROKEN);

export interface Ship {
  type: Type;
  decks: Deck[];
}

export const isKilled = (ship: Ship) =>
  pipe(ship.decks, RA.every(isBrokenDeck));

function isDeckWithCoords(coords: Coords) {
  return (deck: Deck) => deck.x === coords.x && deck.y === coords.y;
}

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
          if (isDeckWithCoords(attackCoords)(deck)) {
            const attackResult = isBrokenDeck(deck)
              ? AR.double(attackCoords)
              : AR.shot(attackCoords);
            return {
              decks: [...acc.decks, brokenDeck(deck)],
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
          decks: [] as Deck[],
          attackResult: O.none as O.Option<AR.Shot | AR.Double>,
        }
      ),
      (x) => {
        const newShip = { ...ship, decks: x.decks };

        const newAttackResult = pipe(
          x.attackResult,
          O.map((attackResult) => {
            if (AR.isShot(attackResult)) {
              if (newShip.decks.every(isBrokenDeck)) {
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
