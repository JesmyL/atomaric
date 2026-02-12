import { Atom } from '../../types';
import { IAtomSetDoActions } from '../../types/do.classes.model/ISet';
import { AtomDoActionsBasic } from './_Basic';

export class AtomSetDoActions<Value> extends AtomDoActionsBasic implements IAtomSetDoActions<Value> {
  constructor(private a: Atom<Set<Value>>, actions: Record<string, AnyFunc> | nil) {
    super(actions);
    this.a = a;
  }

  add = (value: Value) => {
    if (this.a.get().has(value)) return;

    this.a.set(new Set(this.a.get()).add(value));
  };

  delete = (value: Value) => {
    if (!this.a.get().has(value)) return;

    const newSet = new Set(this.a.get());
    newSet.delete(value);
    this.a.set(newSet);
  };

  toggle = (value: Value) => {
    const newSet = new Set(this.a.get());

    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);

    this.a.set(newSet);
  };

  clear = () => {
    this.a.set(new Set());
  };
}
