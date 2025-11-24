import { useSyncExternalStore } from 'react';
import {
  atom as atomType,
  configureAtomaric as configureAtomaricType,
  useAtomDo as useAtomDoType,
  useAtomGet as useAtomGetType,
  useAtomSetDeferred as useAtomSetDeferredType,
  useAtomSet as useAtomSetType,
  useAtom as useAtomType,
  useAtomValue as useAtomValueType,
} from '../types';
import { Atom } from './class';

let useSyncExtStore = (() => {
  throw 'call configureAtomaric() before all!';
}) as typeof useSyncExternalStore;

export const configureAtomaric: typeof configureAtomaricType = options =>
  (useSyncExtStore = options.useSyncExternalStore);

export const useAtomValue: typeof useAtomValueType = atom => {
  return useSyncExtStore(atom.subscribe, atom.get);
};

export const useAtomSet: typeof useAtomSetType = atom => atom.set;
export const useAtomSetDeferred: typeof useAtomSetDeferredType = atom => atom.setDeferred;
export const useAtomGet: typeof useAtomGetType = atom => atom.get;
export const useAtomDo: typeof useAtomDoType = atom => atom.do;

export const useAtom: typeof useAtomType = atom => [useAtomValue(atom), useAtomSet(atom)];

export const atom: typeof atomType = (value, storeKeyOrOptions) => new Atom(value, storeKeyOrOptions);
