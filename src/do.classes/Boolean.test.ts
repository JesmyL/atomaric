import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Boolean', () => {
  test('do actions', async () => {
    const testAtom = atom(false, {
      do: (set, get) => ({
        switch(news?: boolean) {
          set(news ?? !get());
        },
      }),
    });

    testAtom.do.switch(true);
    testAtom.do.switch();
    testAtom.do.toggle();
    await wait();

    expect(testAtom.get() === true).toBeTruthy();
  });
});
