/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IAtomMapDoActions<
  MapValue extends Map<any, any>,
  Key extends MapValue extends Map<infer K, any> ? K : never,
  Value extends MapValue extends Map<any, infer V> ? V : never,
> {
  /** like the Map.prototype.set() method, when value is new for key in current atom value */
  setValue: (key: Key, value: Value) => void;

  /** like the Map.prototype.set() method, when key is not exists */
  setIfNo: (key: Key, value: Value) => void;

  /** like the Map.prototype.delete() method */
  delete: (key: Key) => void;

  /** will add value if it doesn't exist, otherwise delete */
  toggle: (key: Key, value: Value) => void;

  /** like the Map.prototype.clear() method */
  clear: () => void;
}
