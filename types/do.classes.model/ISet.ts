export interface IAtomSetDoActions<Value> {
  /** like the Set.prototype.add() method */
  add: (value: Value) => void;

  /** like the Set.prototype.delete() method */
  delete: (value: Value) => void;

  /** will add value if it doesn't exist, otherwise delete */
  toggle: (value: Value) => void;

  /** like the Set.prototype.clear() method */
  clear: () => void;
}
