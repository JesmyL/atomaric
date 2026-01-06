import { Atom } from '../../types';
import { AtomDoActionsBasic } from './_Basic';

export class AtomMapDoActions<
  MapValue extends Map<any, any>,
  Key extends MapValue extends Map<infer K, any> ? K : never,
  Value extends MapValue extends Map<any, infer V> ? V : never,
> extends AtomDoActionsBasic {
  constructor(private atom: Atom<MapValue>, actions: Record<string, Function> | nil) {
    super(actions);
    this.atom = atom;
  }

  /** like the Map.prototype.set() method */
  setValue = (key: Key, value: Value) => {
    const newMap = new Map(this.atom.get());
    newMap.set(key, value);
    this.atom.set(newMap as never);
  };

  /** like the Map.prototype.delete() method */
  delete = (key: Key) => {
    const newMap = new Map(this.atom.get());
    newMap.delete(key);
    this.atom.set(newMap as never);
  };

  /** will add value if it doesn't exist, otherwise delete */
  toggle = (key: Key, value: Value) => {
    const newMap = new Map(this.atom.get());

    if (newMap.has(key)) newMap.delete(key);
    else newMap.set(key, value);

    this.atom.set(newMap as never);
  };

  /** like the Map.prototype.clear() method */
  clear = () => {
    this.atom.set(new Map() as never);
  };
}
