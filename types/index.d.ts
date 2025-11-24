import { useSyncExternalStore } from 'react';
import { Path, PathValue, PathValueDonor } from './paths';

export interface Register {}

type Sunscriber<Value> = (value: Value) => void;

export type AtomStoreKey = `${string}${string}:${string}${string}`;

export type AtomOptions<Value, Actions extends Record<string, Function> = {}> = {
  /** **default: true** */
  warnOnDuplicateStoreKey?: boolean;
  /** will update value if localStorage value is changed
   * **default: true**
   */
  listenStorageChanges?: boolean;

  /** zip Value to stringifiable value */
  zipValue?: (value: Value) => any;
  /** unzip stringifiable value to Value */
  unzipValue?: (packedValue: any) => Value;

  /** make your localStorage value unchangable */
  unchangable?: true;
  /** return value expire Date */
  exp?: (self: Atom<Value>, isValueWasStoraged: boolean) => Date;
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
        self: Atom<Value>,
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
  /** transform current taken value */
  update: (updater: (value: Value) => void) => void;
};

export type NumberActions<Value> = {
  /** pass the 2 to increment on 2, pass the -2 to decrement on 2
   * **default: 1**
   */
  increment: (delta?: number) => void;
};

export type ObjectActions<Value> = UpdateAction<Value> & {
  /** pass partial object to update some field values */
  setPartial: (value: Partial<Value> | ((value: Value) => Partial<Value>)) => void;
  /** pass partial value to update some deep values by flat path */
  setDeepPartial: <
    ValuePath extends Path<Value, Sep>,
    Val extends PathValue<Value, Sep, ValuePath>,
    Sep extends string = ObjectActionsSetDeepPartial,
  >(
    path: ValuePath,
    value: Val | ((value: Val) => Val),
    donor: PathValueDonor<Value, Sep, ValuePath> | null,
    separator?: Sep,
  ) => void;
};

export type ObjectActionsSetDeepPartial = Register extends {
  keyPathSeparator: infer Separator extends string;
}
  ? Separator
  : '.';

export type BooleanActions = {
  /** toggle current value between true/false */
  toggle: () => void;
};

export type SetActions<Value> = UpdateAction<Value> & {
  /** like the Set.prototype.add() method */
  add: (value: Value) => void;
  /** like the Set.prototype.delete() method */
  delete: (value: Value) => void;
  /** will add value if it doesn't exist, otherwise delete */
  toggle: (value: Value) => void;
  /** like the Set.prototype.clear() method */
  clear: () => void;
};

export type ArrayActions<Value> = UpdateAction<Value[]> & {
  /** like the Array.prototype.push() method */
  push: (...values: Value[]) => void;
  /** like the Array.prototype.unshift() method */
  unshift: (...values: Value[]) => void;
  /** like the Array.prototype.filter() method, but callback is optional - (it) => !!it */
  filter: (filter?: (value: Value, index: number, array: Value[]) => any) => void;
  /** will add value if it doesn't exist, otherwise delete */
  toggle: (value: Value, isAddInStart?: boolean) => void;
};

export type DefaultActions<Value> = Value extends Set<infer Val>
  ? SetActions<Val>
  : Value extends boolean
  ? BooleanActions
  : Value extends (infer Val)[]
  ? ArrayActions<Val>
  : Value extends number
  ? NumberActions<Value>
  : Value extends object
  ? ObjectActions<Value>
  : {};

declare class Atom<Value, Actions extends Record<string, Function> = {}> {
  constructor(initialValue: Value, storeKeyOrOptions: StoreKeyOrOptions<Value, Actions> | undefined);

  /** initial value */
  readonly initialValue: Value;
  /** get current value */
  readonly get: () => Value;
  /** set current value */
  readonly set: AtomSetMethod<Value>;
  /** set current value with debounce */
  readonly setDeferred: AtomSetDeferredMethod<Value>;
  /** set current value as default (initial) */
  readonly reset: () => void;
  /** subscribe on value changes */
  readonly subscribe: AtomSubscribeMethod<Value>;
  /** your custom actions */
  readonly do: Actions & DefaultActions<Value>;
  /** check is current value not changed */
  readonly isInitialValue: () => boolean;
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

/** invoke this function before all atom usages */
export function configureAtomaric(options: {
  useSyncExternalStore: typeof useSyncExternalStore;
  keyPathSeparator: ObjectActionsSetDeepPartial;
}): void;
