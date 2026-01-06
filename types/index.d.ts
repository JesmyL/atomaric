import { useSyncExternalStore } from 'react';
import { AtomArrayDoActions } from '../src/do.classes/Array';
import { AtomBooleanDoActions } from '../src/do.classes/Boolean';
import { AtomMapDoActions } from '../src/do.classes/Map';
import { AtomNumberDoActions } from '../src/do.classes/Number';
import { AtomObjectDoActions } from '../src/do.classes/Object';
import { AtomSetDoActions } from '../src/do.classes/Set';
import { Path, PathValue, PathValueDonor } from './paths';

export type AtomSecureLevel = 0 | 1 | 2 | 3;

export interface Register {}

export type ObjectActionsSetDeepPartialSeparator = Register extends {
  keyPathSeparator: infer Separator extends string;
}
  ? Separator
  : '.';

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
      securifyKeyLevel?: AtomSecureLevel;
      securifyValueLevel?: AtomSecureLevel;
    }
  | {
      /** declare your custom actions */
      do: (
        set: AtomSetMethod<Value>,
        get: () => Value,
        self: Atom<Value>,
        setDeferred: AtomSetDeferredMethod<Value>,
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

export type ObjectActionsSetDeepPartialDoAction<Value> = <
  ValuePath extends Path<Value, Sep>,
  Val extends PathValue<Value, Sep, ValuePath>,
  Sep extends string = ObjectActionsSetDeepPartialSeparator,
>(
  path: ValuePath,
  value: Val | ((value: Val) => Val),
  donor: PathValueDonor<Value, Sep, ValuePath> | null,
  separator?: Sep,
) => void;

export type DefaultActions<Value> = Value extends Set<infer Val>
  ? AtomSetDoActions<Val>
  : Value extends Map<infer Key, infer Val>
  ? AtomMapDoActions<Value, Key, Val>
  : Value extends boolean
  ? AtomBooleanDoActions
  : Value extends (infer Val)[]
  ? AtomArrayDoActions<Val>
  : Value extends number
  ? AtomNumberDoActions
  : Value extends object
  ? AtomObjectDoActions<Value>
  : {};

declare class Atom<Value, Actions extends Record<string, Function> = {}> {
  constructor(initialValue: Value | (() => Value), storeKeyOrOptions: StoreKeyOrOptions<Value, Actions> | undefined);

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
  value: Value | (() => Value),
  storeKeyOrOptions?: StoreKeyOrOptions<Value, Actions>,
): Atom<Value, Actions>;

/** invoke this function before all atom usages */
export function configureAtomaric(options: {
  useSyncExternalStore: typeof useSyncExternalStore;
  keyPathSeparator: ObjectActionsSetDeepPartialSeparator;
  securifyKeyLevel?: AtomSecureLevel;
  securifyValueLevel?: AtomSecureLevel;
}): void;
