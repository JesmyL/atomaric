import { produce } from 'immer';
import { Atom, ObjectActionsSetDeepPartialDoAction } from '../../types';
import { IAtomObjectDoActions } from '../../types/do.classes.model/IObject';
import { configuredOptions } from '../lib';
import { AtomDoActionsBasic } from './_Basic';

export class AtomObjectDoActions<Value extends object>
  extends AtomDoActionsBasic
  implements IAtomObjectDoActions<Value>
{
  constructor(
    private a: Atom<Value>,
    actions: Record<string, AnyFunc> | nil,
  ) {
    super(actions);
  }

  setPartial = (value: Partial<Value> | ((value: Value) => Partial<Value>)) =>
    this.a.set(prev => ({
      ...prev,
      ...(typeof value === 'function' ? value(this.a.get()) : value),
    }));

  update = (updater: (value: Value) => void) => {
    const prev = this.a.get();
    const newValue = produce(prev, val => void updater(val as never));
    if (newValue === prev) return;
    this.a.set(newValue);
  };

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
      const newObject = { ...this.a.get() };
      let lastObject = newObject as Record<string, unknown>;
      let lastDonorObject = donor as Record<string, unknown> | nil;

      for (const key of keys) {
        lastDonorObject = lastDonorObject?.[Array.isArray(lastDonorObject) ? '0' : key] as never;
        const currentObject = lastObject[makeKey(lastObject, key)] ?? (Array.isArray(lastDonorObject) ? [] : {});

        if (currentObject == null || typeof currentObject !== 'object') {
          if (donor == null) throw 'Incorrect path for setDeepPartial';

          const newValue = typeof value === 'function' ? (value as (val: undefined) => Value)(undefined) : value;

          if (this.a.get()[path as never] !== newValue) this.setPartial({ [path]: newValue } as never);
          return;
        }

        lastObject = lastObject[makeKey(lastObject, key)] = (
          Array.isArray(currentObject) ? [...currentObject] : { ...currentObject }
        ) as never;
      }

      const prev = lastObject[lastKey];
      lastObject[lastKey] =
        typeof value === 'function' ? (value as (val: unknown) => Value)(lastObject[lastKey]) : value;

      if (prev !== lastObject[lastKey]) this.a.set(newObject);

      return;
    }

    const prevValue = this.a.get()[path as never];
    const newValue = typeof value === 'function' ? (value as (val: Value) => Value)(prevValue) : value;
    if (newValue !== prevValue) this.setPartial({ [path]: newValue } as never);
  };
}

const makeKey = (obj: object, key: string) => (Array.isArray(obj) ? `${+key}` : key);
