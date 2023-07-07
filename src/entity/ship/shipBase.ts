import { Type } from "./type";

type Deck = {
  x: number;
  y: number;
  state: "broken" | "unbroken";
};

export interface Ship {
  type: Type;
  decks: Deck[];
}
