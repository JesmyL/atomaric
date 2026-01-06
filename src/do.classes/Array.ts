import { Atom } from '../../types';
import { AtomUpdateDoAction } from './_Update';

export class AtomArrayDoActions<Value> extends AtomUpdateDoAction {
  constructor(private atom: Atom<Value[]>, actions: Record<string, Function> | nil) {
    super(actions);
  }

  /** like the Array.prototype.push() method */
  push = (...values: Value[]) => {
    this.atom.set(this.atom.get().concat(values));
  };

  /** like the Array.prototype.unshift() method */
  unshift = (...values: Value[]) => {
    this.atom.set(values.concat(this.atom.get()));
  };

  /** transform current taken value */
  update = (updater: (value: Value[]) => void) => {
    const prev = this.atom.get();
    const newValue = this.updateValue(prev, updater);
    if (newValue === prev) return;
    this.atom.set(newValue);
  };

  /** like the Array.prototype.filter() method, but callback is optional - (it) => !!it */
  filter = (filter?: (value: Value, index: number, Array: Value[]) => any) => {
    this.atom.set(this.atom.get().filter(filter ?? itIt));
  };

  /** will add value if not exists */
  add = (value: Value) => {
    if (this.atom.get().includes(value)) return;
    this.atom.set(this.atom.get().concat([value]));
  };

  /** will delete value from array */
  remove = (value: Value) => {
    const index = this.atom.get().indexOf(value);
    if (index < 0) return;
    const newArray = this.atom.get().slice(0);
    newArray.splice(index, 1);
    this.atom.set(newArray);
  };

  /** will add value if it doesn't exist, otherwise delete */
  toggle = (value: Value, isAddToStart?: boolean) => {
    const newArray = this.atom.get().slice();
    const index = newArray.indexOf(value);
    if (index < 0) {
      if (isAddToStart) newArray.unshift(value);
      else newArray.push(value);
    } else newArray.splice(index, 1);
    this.atom.set(newArray);
  };
}

const itIt = <It>(it: It) => it;
