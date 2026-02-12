import { Atom } from '../../types';
import { IAtomNumberDoActions } from '../../types/do.classes.model/INumber';
import { AtomDoActionsBasic } from './_Basic';

export class AtomNumberDoActions extends AtomDoActionsBasic implements IAtomNumberDoActions {
  constructor(private a: Atom<number>, actions: Record<string, AnyFunc> | nil) {
    super(actions);
  }

  increment = (delta?: number) => {
    this.a.set(+this.a.get() + (delta ?? 1));
  };
}
