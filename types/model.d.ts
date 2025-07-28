type Sunscriber<Value> = (value: Value) => void;

export class Atom<Value> {
  constructor(defaultValue: Value, storeKey: `${string}${string}:${string}${string}` | undefined);

  readonly defaultValue: Value;
  readonly get: () => Value;
  readonly reset: () => void;
  readonly toggle: () => void;
  readonly inkrement: (delta: number) => void;
  readonly subscribe: (sub: Sunscriber<Value>) => () => void;
  readonly set: (value: Value | ((prev: Value) => Value), isPreventSave?: boolean) => void;
}

export function useAtomValue<Value>(atom: Atom<Value>): Value;
export function useAtomSet<Value>(atom: Atom<Value>): (typeof atom)['set'];
export function useAtomGet<Value>(atom: Atom<Value>): (typeof atom)['get'];
export function useAtomToggle(atom: Atom<boolean>): (typeof atom)['toggle'];
export function useAtomInkrement(atom: Atom<number>): (typeof atom)['inkrement'];

export function useAtom<Value>(atom: Atom<Value>): [Value, (typeof atom)['set']];

export function atom<Value>(value: Value, storeKey?: `${string}${string}:${string}${string}`): Atom<Value>;

export function registerReactUseSyncExternalStoreHookFunc(hook: typeof useSyncExternalStore): void;
