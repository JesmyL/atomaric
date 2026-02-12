/* eslint-disable @typescript-eslint/no-explicit-any */
import { Atom } from '../../types';
import { IAtomMapDoActions } from '../../types/do.classes.model/IMap';
import { AtomDoActionsBasic } from './_Basic';

export class AtomMapDoActions<
    MapValue extends Map<any, any>,
    Key extends MapValue extends Map<infer K, any> ? K : never,
    Value extends MapValue extends Map<any, infer V> ? V : never,
  >
  extends AtomDoActionsBasic
  implements IAtomMapDoActions<MapValue, Key, Value>
{
  constructor(private a: Atom<MapValue>, actions: Record<string, AnyFunc> | nil) {
    super(actions);
    this.a = a;
  }

  setValue = (key: Key, value: Value) => {
    if (this.a.get().get(key) === value) return;

    const newMap = new Map(this.a.get());
    newMap.set(key, value);

    this.a.set(newMap as never);
  };

  setIfNo = (key: Key, value: Value) => {
    if (this.a.get().has(key)) return;

    const newMap = new Map(this.a.get());
    newMap.set(key, value);

    this.a.set(newMap as never);
  };

  delete = (key: Key) => {
    if (!this.a.get().has(key)) return;

    const newMap = new Map(this.a.get());
    newMap.delete(key);

    this.a.set(newMap as never);
  };

  toggle = (key: Key, value: Value) => {
    const newMap = new Map(this.a.get());

    if (newMap.has(key)) newMap.delete(key);
    else newMap.set(key, value);

    this.a.set(newMap as never);
  };

  clear = () => {
    this.a.set(new Map() as never);
  };
}
