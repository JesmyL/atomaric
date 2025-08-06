import { useSyncExternalStore } from 'react';
import {
  registerReactHooks as registerReactHooksType,
  useAtomGet as useAtomGetType,
  useAtomInkrement as useAtomInkrementType,
  useAtomSet as useAtomSetType,
  useAtomToggle as useAtomToggleType,
  useAtomValue as useAtomValueType,
} from '../types/model';
import { Atom } from './class';

let useSyncExtStore = (() => {
  throw 'you meed pass react useSyncExternalStore hook func in registerReactHooks() before all actions';
}) as typeof useSyncExternalStore;

export const registerReactHooks: typeof registerReactHooksType = hooks =>
  (useSyncExtStore = hooks.useSyncExternalStore);

export const useAtomValue: typeof useAtomValueType = atom => {
  return useSyncExtStore(atom.subscribe, atom.get);
};

export const useAtomSet: typeof useAtomSetType = atom => atom.set;
export const useAtomGet: typeof useAtomGetType = atom => atom.get;
export const useAtomToggle: typeof useAtomToggleType = atom => atom.toggle;
export const useAtomInkrement: typeof useAtomInkrementType = atom => atom.inkrement;

export const useAtom = <Value>(atom: Atom<Value>) => [useAtomValue(atom), useAtomSet(atom)] as const;

export const atom = <Value>(value: Value, storeKey?: `${string}${string}:${string}${string}`): Atom<Value> =>
  new Atom(value, storeKey);
