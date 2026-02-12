import { Atom } from '../../types';
import { IAtomBooleanDoActions } from '../../types/do.classes.model/IBoolean';
import { AtomDoActionsBasic } from './_Basic';

export class AtomBooleanDoActions extends AtomDoActionsBasic implements IAtomBooleanDoActions {
  constructor(private a: Atom<boolean>, actions: Record<string, AnyFunc> | nil) {
    super(actions);
  }

  toggle = () => {
    this.a.set(!this.a.get());
  };
}
