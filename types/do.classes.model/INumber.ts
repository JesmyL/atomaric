export interface IAtomNumberDoActions {
  /** pass the 2 to increment on 2, pass the -2 to decrement on 2
   * **default: 1**
   */
  increment: (delta?: number) => void;
}
