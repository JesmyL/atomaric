import { Atom } from '../../types';
import { AtomDoActionsBasic } from './_Basic';

export class AtomNumberDoActions extends AtomDoActionsBasic {
  constructor(private atom: Atom<number>, actions: Record<string, Function> | nil) {
    super(actions);
  }

  /** pass the 2 to increment on 2, pass the -2 to decrement on 2
   * **default: 1**
   */
  increment = (delta?: number) => {
    this.atom.set(+this.atom.get() + (delta ?? 1));
  };
}
