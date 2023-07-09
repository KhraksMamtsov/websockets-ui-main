import { endpoint } from "../controller";
import { attackHandler } from "./attack.handler";
import { attackTg } from "./attack.tg";

export const attackEndpoint = endpoint("attack", attackTg, attackHandler);
