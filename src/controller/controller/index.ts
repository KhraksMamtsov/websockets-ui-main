import * as tg from "../../lib/typeGuard";
import { pipe } from "../../lib/functions";
import * as J from "../../lib/json";
import * as E from "../../lib/either";
import * as RA from "../../lib/readonlyArray";
import type { Compute } from "../../lib/types";
import type WebSocket from "ws";
import type { UserDb } from "../../db/User.db";
import type { WinnerDb } from "../../db/WinnerDb";
import { WebSocketServer } from "ws";
import type { OpenRoomDb } from "../../db/OpenRoomDb";
import type { GameDb } from "../../db/Game.db";

enum ParseError {
  NOT_JSON = "NOT_JSON",
  NOT_A_COMMAND = "NOT_A_COMMAND",
  DATA_NOT_JSON = "DATA_NOT_JSON",
  UNKNOWN_COMMAND = "UNKNOWN_COMMAND",
  WRONG_DATA = "WRONG_DATA",
}

const rawCommandTG = <C extends string>(commandType: C) =>
  tg.shape({
    type: tg.string([commandType]),
    data: tg.string(),
    id: tg.number(),
  });

export type HandlerDeps = Readonly<{
  ws: WebSocket;
  userDb: UserDb;
  wss: WebSocketServer;
  roomDb: OpenRoomDb;
  gameDb: GameDb;
  winnersDb: WinnerDb;
}>;

export function endpoint<
  C extends string,
  B extends tg.TypeGuard<unknown, unknown>
>(
  command: C,
  data: B,
  handler: (command: ParsedCommand<C, B>) => (resources: HandlerDeps) => void
) {
  return [command, data, handler] as const;
}

const commandTg = tg.shape({
  type: tg.string(),
  data: tg.string(),
  id: tg.number(),
});

export function createController(
  endpoints: ReadonlyArray<
    readonly [
      command: string,
      data: tg.TypeGuard<unknown, unknown>,
      handler: (
        command: unknown
      ) => (deps: {
        ws: WebSocket;
        wss: WebSocketServer;
        roomDb: OpenRoomDb;
        gameDb: GameDb;
        userDb: UserDb;
        winnersDb: WinnerDb;
      }) => void
    ]
  >
): (
  data: Buffer
) => (deps: {
  ws: WebSocket;
  roomDb: OpenRoomDb;
  userDb: UserDb;
  gameDb: GameDb;
  winnersDb: WinnerDb;
  wss: WebSocketServer;
}) => void {
  const findEndpoint = (type: string) =>
    pipe(
      endpoints,
      RA.findFirst((e) => e[0] === type),
      E.fromOption(() => ParseError.UNKNOWN_COMMAND)
    );

  return (data) => {
    return pipe(
      J.parse(data.toString()),
      E.mapLeft(() => ParseError.NOT_JSON),
      E.chain(E.fromPredicate(commandTg, () => ParseError.NOT_A_COMMAND)),
      E.bindTo("command"),
      E.bind("endpoint", ({ command }) => pipe(command.type, findEndpoint)),
      E.chain(({ command, endpoint }) =>
        pipe(
          command.data === "" ? "null" : command.data,
          J.parse,
          E.mapLeft(() => ParseError.DATA_NOT_JSON),
          E.chain(E.fromPredicate(endpoint[1], () => ParseError.WRONG_DATA)),
          E.map((data) =>
            endpoint[2]({
              ...command,
              data,
            })
          )
        )
      ),
      E.get((x) => (deps: { ws: WebSocket }) => {
        deps.ws.send(x);
      })
    );
  };
}

export type ParsedCommand<
  K extends string,
  TG extends tg.TypeGuard<unknown, unknown>
> = Compute<Omit<Command<K>, "data"> & { readonly data: tg.Infer<TG> }>;

type Command<X extends string> = tg.Infer<ReturnType<typeof rawCommandTG<X>>>;
