import { Atom } from 'class';
import { AtomOptions, AtomStoreKey, DefaultActions } from '../types/model';

export const makeDoFillerActions = <Value, Actions extends Record<string, Function>>(
  initialValue: Value,
  atom: Atom<Value, Actions>,
  storeKeyOrOptions: AtomStoreKey | AtomOptions<Value, Actions> | undefined,
) => {
  let defaultActions: DefaultActions<any> | null = null;

  if (typeof initialValue === 'number') {
    defaultActions = fillActions<number>(
      {
        increment: delta => {
          atom.set((+atom.get() + (delta ?? 0)) as never);
        },
      },
      initialValue,
    );
  } else if (typeof initialValue === 'boolean') {
    defaultActions = fillActions<boolean>(
      {
        toggle: () => {
          atom.set(!atom.get() as never);
        },
      },
      initialValue,
    );
  } else if (Array.isArray(initialValue)) {
    defaultActions = fillActions<any[]>(
      {
        push: (...values) => {
          atom.set((atom.get() as []).concat(values as never) as never);
        },
        unshift: (...values) => {
          atom.set(values.concat(atom.get()) as never);
        },
        update: updater => {
          const newArray = (atom.get() as []).slice();
          updater(newArray);
          atom.set(newArray as never);
        },
        filter: filter => {
          atom.set((atom.get() as []).filter(filter ?? itIt) as never);
        },
      },
      initialValue,
    );
  } else if (initialValue instanceof Set) {
    defaultActions = fillActions<Set<any>>(
      {
        add: value => {
          atom.set(new Set(atom.get() as never).add(value) as never);
        },
        delete: value => {
          const newSet = new Set(atom.get() as never);
          newSet.delete(value);
          atom.set(newSet as never);
        },
        toggle: value => {
          const newSet = new Set(atom.get() as never);

          if (newSet.has(value)) newSet.delete(value);
          else newSet.add(value);

          atom.set(newSet as never);
        },
        clear: () => {
          atom.set(new Set() as never);
        },
        update: updater => {
          const newSet = new Set(atom.get() as never);
          updater(newSet);
          atom.set(newSet as never);
        },
      },
      initialValue,
    );
  } else if (initialValue instanceof Object) {
    defaultActions = fillActions<object>(
      {
        setPartial: value =>
          atom.set(prev => ({
            ...prev,
            ...(typeof value === 'function' ? value(atom.get() as never) : value),
          })),
      },
      initialValue,
    );
  }

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

  if (actions)
    Object.keys(actions).forEach(key => Object.defineProperty(doActions, key, { get: () => actions[key as never] }));

  if (defaultActions)
    Object.keys(defaultActions).forEach(key =>
      Object.defineProperty(doActions, key, { get: () => defaultActions[key as never] }),
    );

  return doActions;
};

const itIt = <It>(it: It) => it;
const fillActions = <Value>(actions: DefaultActions<Value>, _value: Value) => actions;
