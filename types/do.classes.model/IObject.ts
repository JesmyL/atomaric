import { ObjectActionsSetDeepPartialDoAction } from '..';

export interface IAtomObjectDoActions<Value extends object> {
  /** pass partial object to update some field values */
  setPartial: (value: Partial<Value> | ((value: Value) => Partial<Value>)) => void;

  /** transform current taken value */
  update: (updater: (value: Value) => void) => void;

  /** pass partial value to update some deep values by flat path */
  setDeepPartial: ObjectActionsSetDeepPartialDoAction<Value>;
}
