type Sunscriber<Value> = (value: Value) => void;

export type AtomStoreKey = `${string}${string}:${string}${string}`;

export type AtomOptions<Value> = {
  storeKey?: AtomStoreKey;
  /** **default: true** */
  warnOnDuplicateStoreKey?: boolean;
  /** **default: true** */
  listenStorageChanges?: boolean;
  parseValue?: (stringifiedValue: string) => Value;
  stringifyValue?: (value: Value) => string;
};

export type AtomSetMethod<Value> = (value: Value | ((prev: Value) => Value), isPreventSave?: boolean) => void;
export type AtomSetDeferredMethod<Value> = (
  value: Value | ((prev: Value) => Value),
  debounceMs?: number,
  isPreventSave?: boolean,
  isInitInvoke?: boolean,
) => void;

export type AtomSubscribeMethod<Value> = (subscriber: Sunscriber<Value>) => () => void;

export class Atom<Value> {
  constructor(defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value>);

  readonly defaultValue: Value;
  readonly get: () => Value;
  readonly set: AtomSetMethod<Value>;
  readonly setDeferred: AtomSetDeferredMethod<Value>;
  readonly reset: () => void;
  readonly toggle: () => void;
  readonly inkrement: (delta: number) => void;
  readonly subscribe: AtomSubscribeMethod<Value>;
}

export function useAtomValue<Value>(atom: Atom<Value>): Value;
export function useAtomSet<Value>(atom: Atom<Value>): (typeof atom)['set'];
export function useAtomSetDeferred<Value>(atom: Atom<Value>): (typeof atom)['setDeferred'];
export function useAtomGet<Value>(atom: Atom<Value>): (typeof atom)['get'];
export function useAtomToggle(atom: Atom<boolean>): (typeof atom)['toggle'];
export function useAtomInkrement(atom: Atom<number>): (typeof atom)['inkrement'];

export function useAtom<Value>(atom: Atom<Value>): [Value, (typeof atom)['set']];

export type StoreKeyOrOptions<Value> = `${string}${string}:${string}${string}` | AtomOptions<Value>;

export function atom<Value>(value: Value, storeKeyOrOptions?: StoreKeyOrOptions<Value>): Atom<Value>;

export function configureAtomaric(hooks: { useSyncExternalStore: typeof useSyncExternalStore }): void;
