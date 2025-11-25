export const makeDeepProxyObject = <T extends object>(
  target: T,
  handler: ProxyHandler<T> & {
    onSet: <I extends object>(
      target: I,
      path: (string | number)[],
      setKey: number | string,
      value: unknown,
      prevValue: unknown,
    ) => boolean;
  },
) => {
  const proxer = <I extends object>(target: I, keys: (number | string)[], level: number) =>
    new Proxy(target, {
      get: (target, key, reciever) => {
        const value =
          level === 0 && handler.get != null ? handler.get(target as never, key, reciever) : target[key as never];

        return typeof value === 'object' && value !== null
          ? proxer(
              Array.isArray(value) ? value.slice(0) : { ...value },
              keys.concat(Array.isArray(target) ? +(key as never) : (key as never)),
              level + 1,
            )
          : value;
      },
      set: (target, key, value) => {
        if (!handler.onSet(target, keys, key as never, value, target[key as never])) return true;
        target[key as never] = value as never;
        return true;
      },
    });

  return proxer(target, [], 0);
};
