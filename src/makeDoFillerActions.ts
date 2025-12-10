import { Atom } from 'class';
import { AtomOptions, AtomStoreKey, DefaultActions } from '../types';
import { configuredOptions } from './lib';
import { makeDeepProxyObject } from './makeDeepProxyObject';

type nil = null | undefined;

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
          const prev = atom.get();
          const newValue = updateValue(prev, updater);
          if (newValue === prev) return;
          atom.set(newValue);
        },
        filter: filter => {
          atom.set(atom.get().filter(filter ?? itIt));
        },
        add: value => {
          if (atom.get().includes(value)) return;
          atom.set(atom.get().concat([value]));
        },
        remove: value => {
          const index = atom.get().indexOf(value);
          if (index < 0) return;
          const newArray = atom.get().slice(0);
          newArray.splice(index, 1);
          atom.set(newArray);
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
      }),
      initialValue,
    );
  } else if (initialValue instanceof Object) {
    const keyPathSeparator = configuredOptions.keyPathSeparator || '.';

    defaultActions = fillActions<object>(
      atom as never,
      atom => ({
        setPartial: value =>
          atom.set(prev => ({
            ...prev,
            ...(typeof value === 'function' ? value(atom.get()) : value),
          })),
        update: updater => {
          const prev = atom.get();
          const newValue = updateValue(prev, updater);
          if (newValue === prev) return;
          atom.set(newValue);
        },
        setDeepPartial: (path: string, value: any, donor, separator = keyPathSeparator as never) => {
          if (!separator) return;

          if (path.includes(separator)) {
            let keys = path.split(separator);
            const lastKey = keys[keys.length - 1];
            keys = keys.slice(0, -1);
            const newObject = { ...atom.get() };
            let lastObject: Record<string, unknown> = newObject;
            let lastDonorObject = donor as Record<string, unknown> | nil;

            for (const key of keys) {
              lastDonorObject = lastDonorObject?.[Array.isArray(lastDonorObject) ? '0' : key] as never;
              const currentObject = lastObject[makeKey(lastObject, key)] ?? (Array.isArray(lastDonorObject) ? [] : {});

              if (currentObject == null || typeof currentObject !== 'object') {
                if (donor == null) throw 'Incorrect path for setDeepPartial';

                const newValue = typeof value === 'function' ? value(undefined) : value;

                if (atom.get()[path as never] !== newValue) atom.do.setPartial({ [path]: newValue });
                return;
              }

              lastObject = lastObject[makeKey(lastObject, key)] = (
                Array.isArray(currentObject) ? [...currentObject] : { ...currentObject }
              ) as never;
            }

            const prev = lastObject[lastKey];
            lastObject[lastKey] = typeof value === 'function' ? value(lastObject[lastKey]) : value;

            if (prev !== lastObject[lastKey]) atom.set(newObject);

            return;
          }

          const prevValue = atom.get()[path as never];
          const newValue = typeof value === 'function' ? value(prevValue) : value;
          if (newValue !== prevValue) atom.do.setPartial({ [path]: newValue });
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

const updateValue = <Object extends object | unknown[]>(object: Object, updater: (object: Object) => void): Object => {
  const newObject = Array.isArray(object) ? object.slice(0) : { ...object };
  let isSomeSetted = false;

  const pro = makeDeepProxyObject(object, {
    onSet: (_, keys, setKey, value, prevValue) => {
      if (value === prevValue) return true;
      let currentObject = newObject as Record<string, unknown> | unknown[];

      isSomeSetted = true;

      for (const key of keys) {
        const nextObject = currentObject[key as never] as object;

        currentObject = currentObject[key as never] = (
          Array.isArray(nextObject) ? nextObject.slice(0) : { ...nextObject }
        ) as never;
      }

      currentObject[setKey as never] = value as never;

      return true;
    },
  });

  updater(pro);

  return isSomeSetted ? (newObject as never) : object;
};

const makeKey = (obj: object, key: string) => (Array.isArray(obj) ? `${+key}` : key);
