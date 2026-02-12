/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IAtomArrayDoActions<Value> {
  /** like the Array.prototype.push() method */
  push: (...values: Value[]) => void;

  /** like the Array.prototype.unshift() method */
  unshift: (...values: Value[]) => void;

  /** transform current taken value */
  update: (updater: (value: Value[]) => void) => void;

  /** like the Array.prototype.filter() method, but callback is optional - (it) => !!it */
  filter: (filter?: (value: Value, index: number, Array: Value[]) => any) => void;

  /** will add value if not exists */
  add: (value: Value) => void;

  /** will delete first found value from array */
  removeFirst: (value: Value) => void;

  /** will add value if it doesn't exist, otherwise delete */
  toggle: (value: Value, isAddToStart?: boolean) => void;
}
