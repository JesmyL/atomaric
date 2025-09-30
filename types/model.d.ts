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
  /** make your localStorage value unchangable */
  unchangable?: true;
} & (
  | {
      /** save in localStorage by this key */
      storeKey: AtomStoreKey;
    }
  | {
      /** declare your custom actions */
      do: (
        set: (value: Value | ((value: Value) => Value), isPreventSave?: boolean) => void,
        get: () => Value,
        setDeferred: (value: Value | ((value: Value) => Value), debounceMs?: number, isPreventSave?: boolean) => void,
      ) => Actions;
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

export type ObjectActions<Value> = {
  setPartial: (value: Partial<Value> | ((value: Value) => Partial<Value>)) => void;
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

export type DefaultActions<Value> = Value extends Set<infer Val>
  ? SetActions<Val>
  : Value extends boolean
  ? BooleanActions<Value>
  : Value extends (infer Val)[]
  ? ArrayActions<Val>
  : Value extends number
  ? NumberActions<Value>
  : Value extends object
  ? ObjectActions<Value>
  : {};

export class Atom<Value, Actions extends Record<string, Function> = {}> {
  constructor(defaultValue: Value, storeKeyOrOptions: StoreKeyOrOptions<Value, Actions> | undefined);

  readonly defaultValue: Value;
  readonly get: () => Value;
  readonly set: AtomSetMethod<Value>;
  readonly setDeferred: AtomSetDeferredMethod<Value>;
  /** set default (initial) value as current */
  readonly reset: () => void;
  /** subscribe on value changes */
  readonly subscribe: AtomSubscribeMethod<Value>;
  /** your custom actions */
  readonly do: Actions & DefaultActions<Value>;
}

export function useAtom<Value>(atom: Atom<Value>): [Value, AtomSetMethod<Value>];

/** observable atom value */
export function useAtomValue<Value>(atom: Atom<Value>): Value;

export function useAtomSet<Value>(atom: Atom<Value>): AtomSetMethod<Value>;
export function useAtomSetDeferred<Value>(atom: Atom<Value>): AtomSetDeferredMethod<Value>;
export function useAtomGet<Value>(atom: Atom<Value>): () => Value;

/** get your custom actions */
export function useAtomDo<Value, Actions extends Record<string, Function> = {}>(
  atom: Atom<Value, Actions>,
): Actions & DefaultActions<Value>;

export type StoreKeyOrOptions<Value, Actions extends Record<string, Function> = {}> =
  | AtomStoreKey
  | AtomOptions<Value, Actions>;

export function atom<Value, Actions extends Record<string, Function> = {}>(
  value: Value,
  storeKeyOrOptions?: StoreKeyOrOptions<Value, Actions>,
): Atom<Value, Actions>;

export function configureAtomaric(options: { useSyncExternalStore: typeof useSyncExternalStore }): void;
