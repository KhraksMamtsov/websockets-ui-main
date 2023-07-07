import * as O from "./option";

export const get =
  <K>(key: K) =>
  <V>(map: ReadonlyMap<K, V>): O.Option<V> =>
    map.has(key) ? O.some(map.get(key)!) : O.none;
