type Sunscriber<Value> = (value: Value) => void;

export type AtomStoreKey = `${string}${string}:${string}${string}`;

export type AtomOptions<Value, Actions extends Record<string, Function> = {}> = {
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
      do: (get: () => Value, set: (value: Value, isPreventSave?: boolean) => void) => Actions;
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

export type UpdateAction<Value> = {
  update: (updater: (value: Value) => void) => void;
};

export type NumberActions<Value> = {
  increment: (delta?: number) => void;
};

export type BooleanActions<Value> = {
  toggle: () => void;
};

export type SetActions<Value> = UpdateAction<Value> & {
  add: (value: Value) => void;
  delete: (value: Value) => void;
  clear: () => void;
};

export type ArrayActions<Value> = UpdateAction<Value[]> & {
  push: (...values: Value[]) => void;
  unshift: (...values: Value[]) => void;
  filter: (filter?: (value: Value, index: number, array: Value[]) => any) => void;
};

export type DefaultActions<Value> = Value extends Set<infer V>
  ? SetActions<V>
  : Value extends boolean
  ? BooleanActions<Value>
  : Value extends (infer Val)[]
  ? ArrayActions<Val>
  : Value extends number
  ? NumberActions<Value>
  : {};

export class Atom<Value, Actions extends Record<string, Function> = {}> {
  constructor(defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value, Actions>);

  readonly defaultValue: Value;
  readonly get: () => Value;
  readonly set: AtomSetMethod<Value>;
  readonly setDeferred: AtomSetDeferredMethod<Value>;
  readonly reset: () => void;
  readonly subscribe: AtomSubscribeMethod<Value>;
  do: Actions & DefaultActions<Value>;
}

export function useAtomValue<Value>(atom: Atom<Value>): Value;
export function useAtomSet<Value>(atom: Atom<Value>): (typeof atom)['set'];
export function useAtomSetDeferred<Value>(atom: Atom<Value>): (typeof atom)['setDeferred'];
export function useAtomGet<Value>(atom: Atom<Value>): (typeof atom)['get'];
export function useAtomDo<Value>(atom: Atom<Value>): (typeof atom)['do'];

export function useAtom<Value>(atom: Atom<Value>): [Value, (typeof atom)['set']];

export type StoreKeyOrOptions<Value, Actions extends Record<string, Function> = {}> =
  | `${string}${string}:${string}${string}`
  | AtomOptions<Value, Actions>;

export function atom<Value, Actions extends Record<string, Function> = {}>(
  value: Value,
  storeKeyOrOptions?: StoreKeyOrOptions<Value, Actions>,
): Atom<Value, Actions>;

export function configureAtomaric(hooks: { useSyncExternalStore: typeof useSyncExternalStore }): void;
