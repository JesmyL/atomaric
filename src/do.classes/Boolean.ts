import { Atom } from '../../types';
import { AtomDoActionsBasic } from './_Basic';

export class AtomBooleanDoActions extends AtomDoActionsBasic {
  constructor(private atom: Atom<boolean>, actions: Record<string, Function> | nil) {
    super(actions);
  }

  /** toggle current value between true/false */
  toggle = () => {
    this.atom.set(!this.atom.get());
  };
}
