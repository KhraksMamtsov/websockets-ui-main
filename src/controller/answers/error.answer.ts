import { answer } from "./answer";
import type { OpenRoom } from "../../entity/openRoom";
import type { User } from "../../entity/user";

const baseError = answer("error");

export const unAuth = baseError({ message: "Unauthorized" });

export const alreadyInRoom = (room: OpenRoom) =>
  baseError({ message: `Already in room ${room.id}` });

export const roomNotFound = (id: number) =>
  baseError({ message: `Room with indexRoom ${id} not found` });

export const roomIsFull = (room: OpenRoom) =>
  baseError({ message: `Room with indexRoom ${room.id} is full` });

export const UnknownUser = (user: User) =>
  baseError({ message: `User ${user.name} with id "${user.id}" is not found` });
