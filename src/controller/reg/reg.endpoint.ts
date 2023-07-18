import { endpoint } from "../controller";
import * as tg from "../../lib/typeGuard";
import { regError, regSuccess } from "../answers/reg.answer";
import { pipe } from "../../lib/functions";
import * as O from "../../lib/option";
import * as E from "../../lib/either";
import { updateRoomsAnswer } from "../answers/updateRoom.answer";
import { updateWinnersAnswer } from "../answers/updateWinners.answer";

export const regEndpoint = endpoint(
  "reg",
  tg.shape({
    name: tg.string(),
    password: tg.string(),
  }),
  (command) =>
    ({ answer, userDb, roomDb, winnersDb }) => {
      pipe(
        {
          name: command.data.name,
          password: command.data.password,
        } as const,
        E.fromPredicate(
          ({ name, password }) => name.length >= 5 || password.length >= 5,
          () => regError("name and password must be grater than 5 symbols")
        ),
        E.chain((validUserDto) => {
          return pipe(
            userDb.getByName(validUserDto.name),
            O.match(
              () =>
                pipe(
                  userDb.create({
                    answer,
                    name: validUserDto.name,
                    password: validUserDto.password,
                  }),
                  E.right
                ),
              (x) => {
                if (x.password === validUserDto.password) {
                  userDb.updateOrCreate({
                    answer,
                    name: validUserDto.name,
                    password: validUserDto.password,
                  });
                  return E.right(x);
                } else {
                  return E.left(regError("Wrong password"));
                }
              }
            )
          );
        }),
        E.match(
          (error) => answer(error),
          (x) => {
            answer(regSuccess(x));

            answer(updateWinnersAnswer(winnersDb.getAll()));

            answer(updateRoomsAnswer(roomDb.getAll()));
          }
        )
      );
    }
);
