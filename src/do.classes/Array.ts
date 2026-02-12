/* eslint-disable @typescript-eslint/no-explicit-any */
import { produce } from 'immer';
import { Atom } from '../../types';
import { IAtomArrayDoActions } from '../../types/do.classes.model/IArray';
import { AtomDoActionsBasic } from './_Basic';

export class AtomArrayDoActions<Value> extends AtomDoActionsBasic implements IAtomArrayDoActions<Value> {
  constructor(
    private a: Atom<Value[]>,
    actions: Record<string, AnyFunc> | nil,
  ) {
    super(actions);
  }

  push = (...values: Value[]) => {
    if (values.length === 0) return;
    this.a.set(this.a.get().concat(values));
  };

  unshift = (...values: Value[]) => {
    if (values.length === 0) return;
    this.a.set(values.concat(this.a.get()));
  };

  update = (updater: (value: Value[]) => void) => {
    const prev = this.a.get();
    const newValue = produce(prev, val => void updater(val as never));
    if (newValue === prev) return;
    this.a.set(newValue);
  };

  filter = (filter?: (value: Value, index: number, Array: Value[]) => any) => {
    const filtered = this.a.get().filter(filter ?? itIt);
    if (filtered.length === this.a.get().length) return;
    this.a.set(filtered);
  };

  add = (value: Value) => {
    if (this.a.get().includes(value)) return;
    this.a.set(this.a.get().concat([value]));
  };

  removeFirst = (value: Value) => {
    const index = this.a.get().indexOf(value);
    if (index < 0) return;
    const newArray = this.a.get().slice(0);
    newArray.splice(index, 1);
    this.a.set(newArray);
  };

  toggle = (value: Value, isAddToStart?: boolean) => {
    const newArray = this.a.get().slice();
    const index = newArray.indexOf(value);

    if (index < 0) {
      if (isAddToStart) newArray.unshift(value);
      else newArray.push(value);
    } else newArray.splice(index, 1);

    this.a.set(newArray);
  };
}

const itIt = <It>(it: It) => it;
