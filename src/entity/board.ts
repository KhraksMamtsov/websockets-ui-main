import type { BoardDto } from "../controller/addShips/boardDto";
import * as RA from "../lib/readonlyArray";
import * as E from "../lib/either";
import { flow, pipe } from "../lib/functions";
import * as S from "./ship";

export type Board = { dto: BoardDto; domain: ReadonlyArray<S.Ship> };

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
        domain: pipe(validDto, RA.map(S.fromDto)),
        dto,
      })
    )
  );

  // TODO: validate

  // const board = dto.reduce(
  //   (acc, shipDto) => {},
  //   E.right<IntermediateBoard>({
  //     [Type.S]: [],
  //     [Type.M]: [],
  //     [Type.L]: [],
  //     [Type.H]: [],
  //   })
  // );

  // return E.right(board);
}
