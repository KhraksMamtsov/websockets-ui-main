import * as C from "../coords";

export enum DeckState {
  BROKEN = "broken",
  UNBROKEN = "unbroken",
}

export type Deck = BrokenDeck | UnbrokenDeck;

export type BrokenDeck = ReturnType<typeof broken>;

export type UnbrokenDeck = ReturnType<typeof unbroken>;

export const deck =
  <T extends DeckState>(state: T) =>
  (coords: C.Coords) =>
    ({
      coords,
      state,
    } as const);

export const broken = deck(DeckState.BROKEN);

export const isBroken = (deck: Deck): deck is BrokenDeck =>
  deck.state === DeckState.BROKEN;
export const unbroken = deck(DeckState.UNBROKEN);

export function isWithCoords(coords: C.Coords) {
  return (deck: Deck) => C.isEqual(deck.coords)(coords);
}
