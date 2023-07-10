import type { BoardDto } from "../controller/addShips/boardDto";
import * as RA from "../lib/readonlyArray";
import * as E from "../lib/either";
import * as O from "../lib/option";
import { flow, pipe } from "../lib/functions";
import * as S from "./ship";
import * as C from "./coords";
import * as AR from "./attackResult";

export type Board = Readonly<{
  dto: BoardDto;
  domain: Readonly<{
    ships: ReadonlyArray<S.Ship>;
    firedCells: FiredCells;
  }>;
}>;

type FiredCells = ReadonlyArray<C.Coords>;

export const isKilled = (board: Board) =>
  pipe(board.domain.ships, RA.every(S.isKilled));

const typeToCountMap: Readonly<Record<S.Type, 1 | 2 | 3 | 4>> = {
  [S.Type.H]: 1,
  [S.Type.L]: 2,
  [S.Type.M]: 3,
  [S.Type.S]: 4,
};

export function fromDto(dto: BoardDto): E.Either<string, Board> {
  // TODO: CHECK FOR CROSSINGS
  return pipe(
    dto,
    RA.map(
      E.fromPredicate(
        S.shipTg,
        (x) => `Ship ${JSON.stringify(x)} has wrong configuration.`
      )
    ),
    RA.validate,
    E.chain(
      flow(
        RA.group((ship) => ship.type),
        RA.entries,
        RA.map(([k, v]) =>
          v.length === typeToCountMap[k]
            ? E.right(v)
            : E.left(
                `Wrong count of "${k}" ships: expected ${typeToCountMap[k]} but got ${v.length}`
              )
        ),
        RA.validate,
        E.map(RA.flatten)
      )
    ),
    E.bimap(
      (errors) => errors.join(",\n"),
      (validDto) => ({
        domain: {
          ships: pipe(validDto, RA.map(S.fromDto)),
          firedCells: [],
        },
        dto,
      })
    )
  );
}

const coordsOnBoard = ({ x, y }: C.Coords) => {
  const coords = [x, y];
  return coords.every((s) => s >= 0) && coords.every((s) => s <= 9);
};

const getShipNeighbors = (ship: S.Ship) =>
  pipe(
    ship.decks,
    RA.map((x) => x.coords),
    RA.chain(({ x, y }) => [
      { x /*  */, y: y + 1 },
      { x: x + 1, y: y + 1 },
      { x: x + 1, y /*  */ },
      { x: x + 1, y: y - 1 },
      { x /*  */, y: y - 1 },
      { x: x - 1, y: y - 1 },
      { x: x - 1, y /*  */ },
      { x: x - 1, y: y + 1 },
    ]),
    RA.filter(coordsOnBoard),
    RA.uniq(C.isEqual),
    RA.filter(
      (neighbor) =>
        !pipe(
          ship.decks,
          RA.map((x) => x.coords),
          RA.some(C.isEqual(neighbor))
        )
    )
  );

const isAttackInFiredCells =
  (firedCells: FiredCells) => (attackCoords: C.Coords) =>
    pipe(firedCells, RA.some(C.isEqual(attackCoords)));

export const attack = (attackCoords: C.Coords) => (board: Board) => {
  return pipe(
    board.domain.ships,
    RA.map(S.attack(attackCoords)),
    (shipsAttackResults) => {
      const newShips = pipe(
        shipsAttackResults,
        RA.map((x) => x.newShip)
      );

      const newAttackResults = pipe(
        shipsAttackResults,
        RA.chain((shipsAttackResult) => {
          const newAttackResults = pipe(
            shipsAttackResult.attackResult,
            O.map((ar) => {
              if (ar.type === AR.AttackResultType.KILLED) {
                return [
                  ...pipe(
                    shipsAttackResult.newShip.decks,
                    RA.map((x) => AR.killed(x.coords))
                  ),
                  ...pipe(
                    shipsAttackResult.newShip,
                    getShipNeighbors,
                    RA.map(AR.miss)
                  ),
                ];
              } else {
                return [ar];
              }
            }),
            O.map(RA.unify),
            O.match(
              () => [] as Array<O.Option<AR.AttackResult>>,
              RA.map(O.some)
            ),
            RA.unify,
            RA.map((x) => ({
              newShip: shipsAttackResult.newShip,
              attackResult: x,
            }))
          );

          return newAttackResults;
        }),
        RA.map((x) => x.attackResult),
        RA.compact,
        O.fromPredicate(RA.isNotEmpty),
        O.alt(() =>
          pipe(
            attackCoords,
            O.fromPredicate(isAttackInFiredCells(board.domain.firedCells)),
            O.map(AR.double),
            O.map(RA.of)
          )
        ),
        O.get(() => RA.of(AR.miss(attackCoords))),
        RA.unify
      );

      const newMisses = newAttackResults.filter(AR.isMiss);

      const newBoard: Board = {
        ...board,
        domain: {
          ships: newShips,
          firedCells: [
            ...board.domain.firedCells,
            ...newMisses.map((x) => x.coords),
          ],
        },
      };

      return {
        newBoard,
        attackResults: newAttackResults,
      };
    }
  );
};
