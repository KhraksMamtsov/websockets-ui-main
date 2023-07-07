import type { User } from "./user";

export interface OpenRoom {
  readonly id: number;
  readonly player: User;
}
