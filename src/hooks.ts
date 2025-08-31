import { useSyncExternalStore } from 'react';
import {
  atom as atomType,
  configureAtomaric as configureAtomaricType,
  useAtomGet as useAtomGetType,
  useAtomInkrement as useAtomInkrementType,
  useAtomSetDeferred as useAtomSetDeferredType,
  useAtomSet as useAtomSetType,
  useAtomToggle as useAtomToggleType,
  useAtom as useAtomType,
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

export const useAtom: typeof useAtomType = atom => [useAtomValue(atom), useAtomSet(atom)];

export const atom: typeof atomType = (value, storeKeyOrOptions) => new Atom(value, storeKeyOrOptions);
