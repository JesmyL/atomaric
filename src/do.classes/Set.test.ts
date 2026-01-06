import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { makeFullKey, wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Set', () => {
  test('do actions', async () => {
    const testAtom = atom(new Set<string>(), {
      storeKey: 'set:test',
      do: (set, get) => ({
        filterValues: () => {
          const array = Array.from(get());
          set(new Set(array.filter(it => it)));
        },
      }),
    });

    testAtom.do.add('!');
    testAtom.do.add('@');
    testAtom.do.add('#');
    testAtom.do.add('');
    await wait();

    expect(localStorage[makeFullKey('set:test')]).toEqual('[["!","@","#",""]]');

    testAtom.do.filterValues();
    await wait();

    expect(localStorage[makeFullKey('set:test')]).toEqual('[["!","@","#"]]');

    testAtom.do.toggle('@');
    await wait();

    expect(localStorage[makeFullKey('set:test')]).toEqual('[["!","#"]]');

    testAtom.do.toggle('@');
    testAtom.do.delete('!');
    await wait();

    expect(localStorage[makeFullKey('set:test')]).toEqual('[["#","@"]]');
  });
});
