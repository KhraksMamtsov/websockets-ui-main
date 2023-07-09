import { attack, Type } from "../src/entity/ship";
import { DeckState } from "../src/entity/ship/shipBase";
import * as O from "../src/lib/option";

const testShip = {
  type: Type.H,
  decks: [
    { state: DeckState.BROKEN, x: 1, y: 0 },
    { state: DeckState.UNBROKEN, x: 2, y: 0 },
    { state: DeckState.UNBROKEN, x: 3, y: 0 },
    { state: DeckState.BROKEN, x: 4, y: 0 },
  ],
};
describe("ship base", () => {
  test("attack shoot one deck", () => {
    const result = attack({
      x: 3,
      y: 0,
    })(testShip);

    expect(result).toStrictEqual({
      newShip: {
        type: Type.H,
        decks: [
          { state: DeckState.BROKEN, x: 1, y: 0 },
          { state: DeckState.UNBROKEN, x: 2, y: 0 },
          { state: DeckState.BROKEN, x: 3, y: 0 },
          { state: DeckState.BROKEN, x: 4, y: 0 },
        ],
      },
      attackResult: O.some({ type: "shot", coords: { x: 3, y: 0 } }),
    });
  });

  test("attack double one deck", () => {
    const result = attack({
      x: 4,
      y: 0,
    })(testShip);

    expect(result).toStrictEqual({
      newShip: {
        type: Type.H,
        decks: [
          { state: DeckState.BROKEN, x: 1, y: 0 },
          { state: DeckState.UNBROKEN, x: 2, y: 0 },
          { state: DeckState.UNBROKEN, x: 3, y: 0 },
          { state: DeckState.BROKEN, x: 4, y: 0 },
        ],
      },
      attackResult: O.some({ type: "double", coords: { x: 4, y: 0 } }),
    });
  });
  test("attack double one deck", () => {
    const result = attack({
      x: 6,
      y: 0,
    })(testShip);

    expect(result).toStrictEqual({
      newShip: {
        type: Type.H,
        decks: [
          { state: DeckState.BROKEN, x: 1, y: 0 },
          { state: DeckState.UNBROKEN, x: 2, y: 0 },
          { state: DeckState.UNBROKEN, x: 3, y: 0 },
          { state: DeckState.BROKEN, x: 4, y: 0 },
        ],
      },
      attackResult: O.none,
    });
  });
});
