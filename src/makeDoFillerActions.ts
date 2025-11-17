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
      atom as never,
      atom => ({
        increment: delta => {
          atom.set(+atom.get() + (delta ?? 0));
        },
      }),
      initialValue,
    );
  } else if (typeof initialValue === 'boolean') {
    defaultActions = fillActions<boolean>(
      atom as never,
      atom => ({
        toggle: () => {
          atom.set(!atom.get());
        },
      }),
      initialValue,
    );
  } else if (Array.isArray(initialValue)) {
    defaultActions = fillActions<any[]>(
      atom as never,
      atom => ({
        push: (...values) => {
          atom.set(atom.get().concat(values));
        },
        unshift: (...values) => {
          atom.set(values.concat(atom.get()));
        },
        update: updater => {
          const newArray = atom.get().slice();
          updater(newArray);
          atom.set(newArray);
        },
        filter: filter => {
          atom.set(atom.get().filter(filter ?? itIt));
        },
        toggle: (value, isAddInStart) => {
          const newArray = atom.get().slice();
          const index = newArray.indexOf(value);
          if (index < 0) {
            if (isAddInStart) newArray.unshift(value);
            else newArray.push(value);
          } else newArray.splice(index, 1);
          atom.set(newArray);
        },
      }),
      initialValue,
    );
  } else if (initialValue instanceof Set) {
    defaultActions = fillActions<Set<any>>(
      atom as never,
      atom => ({
        add: value => {
          atom.set(new Set(atom.get()).add(value));
        },
        delete: value => {
          const newSet = new Set(atom.get());
          newSet.delete(value);
          atom.set(newSet);
        },
        toggle: value => {
          const newSet = new Set(atom.get());

          if (newSet.has(value)) newSet.delete(value);
          else newSet.add(value);

          atom.set(newSet);
        },
        clear: () => {
          atom.set(new Set());
        },
        update: updater => {
          const newSet = new Set(atom.get());
          updater(newSet);
          atom.set(newSet);
        },
      }),
      initialValue,
    );
  } else if (initialValue instanceof Object) {
    defaultActions = fillActions<object>(
      atom as never,
      atom => ({
        setPartial: value =>
          atom.set(prev => ({
            ...prev,
            ...(typeof value === 'function' ? value(atom.get()) : value),
          })),
        update: updater => {
          const newSet = { ...atom.get() };
          updater(newSet);
          atom.set(newSet);
        },
        setDeepPartial: (path: string, value, separator = '.' as never) => {
          if (path.includes(separator)) {
            let parts = path.split(separator);
            const lastKey = parts[parts.length - 1];
            parts = parts.slice(0, -1);
            const newObject = { ...atom.get() };
            let lastObject: object = newObject;

            for (const part of parts) {
              const currentObject = lastObject[part as never] as object;

              if (currentObject == null || typeof currentObject !== 'object') {
                atom.do.setPartial({ [path]: value });
                return;
              }

              lastObject = lastObject[part as never] = (
                Array.isArray(currentObject) ? [...currentObject] : { ...currentObject }
              ) as never;
            }

            lastObject[lastKey as never] = value as never;
            atom.set(newObject);
          } else atom.do.setPartial({ [path]: value });
        },
      }),
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

  if (actions) Object.keys(actions).forEach(key => Object.defineProperty(doActions, key, { get: () => actions[key] }));

  if (defaultActions)
    Object.keys(defaultActions).forEach(key =>
      Object.defineProperty(doActions, key, { get: () => defaultActions[key as never] }),
    );

  return doActions;
};

const itIt = <It>(it: It) => it;
const fillActions = <Value, ValAtom extends Atom<Value> = Atom<Value>>(
  atom: ValAtom,
  actions: (atom: ValAtom) => DefaultActions<Value>,
  _value: Value,
) => actions(atom);
