import type { Json } from "../../lib/json";

export const answer = (type: string) => (data: Json) =>
  JSON.stringify({
    type,
    data: JSON.stringify(data),
  });
