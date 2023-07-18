import { answer } from "./answer";
import type { User } from "../../entity/user";

const baseReg = answer("reg");

export const regSuccess = (user: User) =>
  baseReg({
    index: user.id,
    name: user.name,
    error: false,
  });

export const regError = (errorText: string) =>
  baseReg({
    errorText,
    error: true,
  });
