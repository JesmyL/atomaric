type Sunscriber<Value> = (value: Value) => void;

export type AtomStoreKey = `${string}${string}:${string}${string}`;

export type AtomOptions<Value, Actions extends Record<string, Function>> = {
  /** **default: true** */
  warnOnDuplicateStoreKey?: boolean;
  /** will update value if localStorage value is changed
   * **default: true**
   */
  listenStorageChanges?: boolean;
  /** map localStorage string value to Value */
  parseValue?: (stringifiedValue: string) => Value;
  /** map Value to localStorage string value */
  stringifyValue?: (value: Value) => string;
  /** can not to change localStorage value in dev tools
   * **default: false**
   */
  unchangable?: boolean;
} & (
  | {
      /** save in localStorage by this key */
      storeKey: AtomStoreKey;
    }
  | {
      do: (get: () => Value, set: (value: Value) => void) => Actions;
    }
);

export type AtomSetMethod<Value> = (value: Value | ((prev: Value) => Value), isPreventSave?: boolean) => void;
export type AtomSetDeferredMethod<Value> = (
  value: Value | ((prev: Value) => Value),
  debounceMs?: number,
  isPreventSave?: boolean,
  isInitInvoke?: boolean,
) => void;

export type AtomSubscribeMethod<Value> = (subscriber: Sunscriber<Value>) => () => void;

export type SetActions<Value> = {
  add: (value: Value) => Set<Value>;
  delete: (value: Value) => boolean;
  clear: () => void;
};

export class Atom<Value, Actions extends Record<string, Function>> {
  constructor(defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value, Actions>);

  readonly defaultValue: Value;
  readonly get: () => Value;
  readonly set: AtomSetMethod<Value>;
  readonly setDeferred: AtomSetDeferredMethod<Value>;
  readonly reset: () => void;
  readonly toggle: () => void;
  readonly inkrement: (delta: number) => void;
  readonly subscribe: AtomSubscribeMethod<Value>;
  do: Actions & (Value extends Set<infer V> ? SetActions<V> : {});
}

export function useAtomValue<Value>(atom: Atom<Value>): Value;
export function useAtomSet<Value>(atom: Atom<Value>): (typeof atom)['set'];
export function useAtomSetDeferred<Value>(atom: Atom<Value>): (typeof atom)['setDeferred'];
export function useAtomGet<Value>(atom: Atom<Value>): (typeof atom)['get'];
export function useAtomToggle(atom: Atom<boolean>): (typeof atom)['toggle'];
export function useAtomInkrement(atom: Atom<number>): (typeof atom)['inkrement'];

export function useAtom<Value>(atom: Atom<Value>): [Value, (typeof atom)['set']];

export type StoreKeyOrOptions<Value, Actions extends Record<string, Function>> =
  | `${string}${string}:${string}${string}`
  | AtomOptions<Value, Actions>;

export function atom<Value, Actions extends Record<string, Function>>(
  value: Value,
  storeKeyOrOptions?: StoreKeyOrOptions<Value, Actions>,
): Atom<Value, Actions>;

export function configureAtomaric(hooks: { useSyncExternalStore: typeof useSyncExternalStore }): void;
