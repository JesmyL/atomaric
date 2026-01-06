import { Atom } from '../../types';
import { AtomDoActionsBasic } from './_Basic';

export class AtomSetDoActions<Value> extends AtomDoActionsBasic {
  constructor(private atom: Atom<Set<Value>>, actions: Record<string, Function> | nil) {
    super(actions);
    this.atom = atom;
  }

  /** like the Set.prototype.add() method */
  add = (value: Value) => {
    this.atom.set(new Set(this.atom.get()).add(value));
  };

  /** like the Set.prototype.delete() method */
  delete = (value: Value) => {
    const newSet = new Set(this.atom.get());
    newSet.delete(value);
    this.atom.set(newSet);
  };

  /** will add value if it doesn't exist, otherwise delete */
  toggle = (value: Value) => {
    const newSet = new Set(this.atom.get());

    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);

    this.atom.set(newSet);
  };

  /** like the Set.prototype.clear() method */
  clear = () => {
    this.atom.set(new Set());
  };
}
