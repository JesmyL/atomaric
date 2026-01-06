import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Number', () => {
  test('do actions', async () => {
    const testAtom = atom(100, { do: (set, get) => ({ switchSign: () => set(-get()) }) });
    const testFuncAtom = atom(() => 200, { do: (set, get) => ({ switchSign: () => set(-get()) }) });

    testAtom.do.increment();
    testAtom.do.switchSign();

    testFuncAtom.do.increment(-3);
    testFuncAtom.do.switchSign();
    await wait();

    expect(testAtom.get()).toEqual(-101);
    expect(testFuncAtom.get()).toEqual(-197);
  });
});
