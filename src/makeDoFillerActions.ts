import { AtomOptions, AtomStoreKey } from '../types';
import { Atom } from './class';
import { AtomDoActionsBasic } from './do.classes/_Basic';
import { AtomArrayDoActions } from './do.classes/Array';
import { AtomBooleanDoActions } from './do.classes/Boolean';
import { AtomMapDoActions } from './do.classes/Map';
import { AtomNumberDoActions } from './do.classes/Number';
import { AtomObjectDoActions } from './do.classes/Object';
import { AtomSetDoActions } from './do.classes/Set';

export const makeDoFillerActions = <Value, Actions extends Record<string, Function>>(
  initialValue: Value,
  atom: Atom<Value, Actions>,
  storeKeyOrOptions: AtomStoreKey | AtomOptions<Value, Actions> | undefined,
) => {
  const actions =
    typeof storeKeyOrOptions === 'object' && storeKeyOrOptions != null && 'do' in storeKeyOrOptions
      ? storeKeyOrOptions.do(
          (value, isPreventSave) => atom.set(value, isPreventSave),
          () => atom.get(),
          atom,
          (value, debounceMs, isPreventSave) => atom.setDeferred(value, debounceMs, isPreventSave),
        )
      : null;

  const doActions = {};

  if (actions) Object.keys(actions).forEach(key => Object.defineProperty(doActions, key, { get: () => actions[key] }));

  if (typeof initialValue === 'number') {
    return new AtomNumberDoActions(atom as never, actions);
  } else if (typeof initialValue === 'boolean') {
    return new AtomBooleanDoActions(atom as never, actions);
  } else if (Array.isArray(initialValue)) {
    return new AtomArrayDoActions(atom as never, actions);
  } else if (initialValue instanceof Set) {
    return new AtomSetDoActions(atom as never, actions);
  } else if (initialValue instanceof Map) {
    return new AtomMapDoActions(atom as never, actions);
  } else if (initialValue instanceof Object) {
    return new AtomObjectDoActions(atom as never, actions);
  }

  return new AtomDoActionsBasic(actions);
};
