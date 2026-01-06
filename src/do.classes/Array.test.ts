import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Array', () => {
  test('simple init', async () => {
    const initArray: number[] = [];
    const testAtom = atom(initArray);
    testAtom.set([]);

    expect(testAtom.get() !== initArray).toBeTruthy();
  });

  test('do actions', async () => {
    const testAtom = atom((): (number | nil | string | { nums: number[] })[] => [], {
      do: (_set, _get, self) => ({
        switch30(toggleValue: string) {
          self.do.toggle(30);
          self.do.toggle(toggleValue);
        },
      }),
    });

    testAtom.do.push(1, 2, 5, 2, 5, 5, 5, 5, 1, null, '', '#');
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 5, 2, 5, 5, 5, 5, 1, null, '', '#']);

    testAtom.do.add(0);
    testAtom.do.add(5);
    testAtom.do.add(8);
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 5, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8]);

    testAtom.do.remove(5);
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8]);

    testAtom.do.toggle('+');
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8, '+']);

    testAtom.do.toggle('+');
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8]);

    testAtom.do.switch30('@');
    await wait();

    expect(testAtom.get()).toEqual([1, 2, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8, 30, '@']);

    testAtom.do.unshift('**');
    await wait();

    expect(testAtom.get()).toEqual(['**', 1, 2, 2, 5, 5, 5, 5, 1, null, '', '#', 0, 8, 30, '@']);

    testAtom.do.filter();
    await wait();

    expect(testAtom.get()).toEqual(['**', 1, 2, 2, 5, 5, 5, 5, 1, '#', 8, 30, '@']);

    testAtom.do.filter(val => typeof val === 'string');
    await wait();

    expect(testAtom.get()).toEqual(['**', '#', '@']);

    testAtom.do.update(val => val.reverse());
    await wait();

    expect(testAtom.get()).toEqual(['@', '#', '**']);

    const nums555 = { nums: [5, 5, 5] };
    const nums123 = { nums: [1, 2, 3] };

    testAtom.do.add(nums123);
    testAtom.do.add(nums555);
    await wait();

    expect(testAtom.get()).toEqual(['@', '#', '**', nums123, nums555]);

    testAtom.do.update(val => {
      if (val[3] && typeof val[3] === 'object' && 'nums' in val[3]) val[3].nums.reverse();
    });
    await wait();

    expect(testAtom.get()).toEqual(['@', '#', '**', { nums: [3, 2, 1] }, nums555]);

    expect(testAtom.get()[4] === nums555).toBeTruthy();
    expect(testAtom.get()[3] !== nums123).toBeTruthy();

    const value = testAtom.get();
    expect(value[3] && typeof value[3] === 'object' && value[3].nums !== nums123.nums).toBeTruthy();
  });
});
