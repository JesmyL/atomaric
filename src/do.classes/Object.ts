import { Atom, ObjectActionsSetDeepPartialDoAction } from '../../types';
import { configuredOptions } from '../lib';
import { AtomUpdateDoAction } from './_Update';

export class AtomObjectDoActions<Value extends object> extends AtomUpdateDoAction {
  constructor(private atom: Atom<Value>, actions: Record<string, Function> | nil) {
    super(actions);
  }

  /** pass partial object to update some field values */
  setPartial = (value: Partial<Value> | ((value: Value) => Partial<Value>)) =>
    this.atom.set(prev => ({
      ...prev,
      ...(typeof value === 'function' ? value(this.atom.get()) : value),
    }));

  /** transform current taken value */
  update = (updater: (value: Value) => void) => {
    const prev = this.atom.get();
    const newValue = this.updateValue(prev, updater);
    if (newValue === prev) return;
    this.atom.set(newValue);
  };

  /** pass partial value to update some deep values by flat path */
  setDeepPartial: ObjectActionsSetDeepPartialDoAction<Value> = (
    path,
    value,
    donor,
    separator = (configuredOptions.keyPathSeparator || '.') as never,
  ) => {
    if (!separator) return;

    if (path.includes(separator)) {
      let keys = path.split(separator);
      const lastKey = keys[keys.length - 1];
      keys = keys.slice(0, -1);
      const newObject = { ...this.atom.get() };
      let lastObject = newObject as Record<string, unknown>;
      let lastDonorObject = donor as Record<string, unknown> | nil;

      for (const key of keys) {
        lastDonorObject = lastDonorObject?.[Array.isArray(lastDonorObject) ? '0' : key] as never;
        const currentObject = lastObject[makeKey(lastObject, key)] ?? (Array.isArray(lastDonorObject) ? [] : {});

        if (currentObject == null || typeof currentObject !== 'object') {
          if (donor == null) throw 'Incorrect path for setDeepPartial';

          const newValue = typeof value === 'function' ? (value as (val: undefined) => Value)(undefined) : value;

          if (this.atom.get()[path as never] !== newValue) this.setPartial({ [path]: newValue } as never);
          return;
        }

        lastObject = lastObject[makeKey(lastObject, key)] = (
          Array.isArray(currentObject) ? [...currentObject] : { ...currentObject }
        ) as never;
      }

      const prev = lastObject[lastKey];
      lastObject[lastKey] =
        typeof value === 'function' ? (value as (val: unknown) => Value)(lastObject[lastKey]) : value;

      if (prev !== lastObject[lastKey]) this.atom.set(newObject);

      return;
    }

    const prevValue = this.atom.get()[path as never];
    const newValue = typeof value === 'function' ? (value as (val: Value) => Value)(prevValue) : value;
    if (newValue !== prevValue) this.setPartial({ [path]: newValue } as never);
  };
}

const makeKey = (obj: object, key: string) => (Array.isArray(obj) ? `${+key}` : key);
