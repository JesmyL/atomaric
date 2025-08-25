import { useSyncExternalStore } from 'react';
import {
  configureAtomaric as configureAtomaricType,
  StoreKeyOrOptions,
  useAtomGet as useAtomGetType,
  useAtomInkrement as useAtomInkrementType,
  useAtomSetDeferred as useAtomSetDeferredType,
  useAtomSet as useAtomSetType,
  useAtomToggle as useAtomToggleType,
  useAtomValue as useAtomValueType,
} from '../types/model';
import { Atom } from './class';

let useSyncExtStore = (() => {
  throw 'call configureAtomaric() before all!';
}) as typeof useSyncExternalStore;

export const configureAtomaric: typeof configureAtomaricType = hooks => (useSyncExtStore = hooks.useSyncExternalStore);

export const useAtomValue: typeof useAtomValueType = atom => {
  return useSyncExtStore(atom.subscribe, atom.get);
};

export const useAtomSet: typeof useAtomSetType = atom => atom.set;
export const useAtomSetDeferred: typeof useAtomSetDeferredType = atom => atom.setDeferred;
export const useAtomGet: typeof useAtomGetType = atom => atom.get;
export const useAtomToggle: typeof useAtomToggleType = atom => atom.toggle;
export const useAtomInkrement: typeof useAtomInkrementType = atom => atom.inkrement;

export const useAtom = <Value>(atom: Atom<Value>) => [useAtomValue(atom), useAtomSet(atom)] as const;

export const atom = <Value>(value: Value, storeKeyOrOptions?: StoreKeyOrOptions<Value>): Atom<Value> =>
  new Atom(value, storeKeyOrOptions);
