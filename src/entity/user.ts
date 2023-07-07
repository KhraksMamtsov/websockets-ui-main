import type WebSocket from "ws";

export interface User {
  name: string;
  password: string;
  id: number;
  ws: WebSocket;
}
