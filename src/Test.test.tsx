import { render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric, useAtomValue } from './lib';
import { makeFullKey, makeFullSecureKey, wait } from './utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Atom', () => {
  test('init value', () => {
    const initValue = 'HeLlO!';
    const initValueAtom = atom(initValue);

    const App = () => {
      const initValue = useAtomValue(initValueAtom);
      return <>{initValue}</>;
    };

    render(<App />);
    expect(screen.getByText(initValue)).toBeInTheDocument();
  });

  test('custom do action', () => {
    const testAtom = atom(new Set<number>(), {
      do: set => ({
        add12num: () => set(prev => new Set(prev).add(12)),
      }),
    });

    testAtom.do.add12num();

    expect(testAtom.get().has(12)).toBeTruthy();
    expect(testAtom.get().has(121)).not.toBeTruthy();
  });

  test('save in localStorage', async () => {
    const storeKey = 'just:test';
    delete localStorage[makeFullKey(storeKey)];

    const testAtom = atom(new Set<number>(), storeKey);

    testAtom.do.add(1);

    await wait();

    expect(localStorage[makeFullKey(storeKey)]).toBe('[[1]]');
  });

  test('save in localStorage with expire time', async () => {
    const storeKey = 'just:test-with-exp';
    delete localStorage[makeFullKey(storeKey)];
    const date = new Date(Date.now() + 2 * 1000);

    const testAtom = atom(new Set<number>(), {
      storeKey,
      exp: () => date,
    });

    testAtom.do.add(1);

    const storagedVal = `[[1],{"exp":${Math.trunc(date.getTime() / 1000)}}]`;

    await wait();
    expect(localStorage[makeFullKey(storeKey)]).toBe(storagedVal);

    await wait(1100);
    expect(localStorage[makeFullKey(storeKey)]).toBe(storagedVal);

    await wait(2100);
    expect(localStorage[makeFullKey(storeKey)]).toBe(undefined);
  });

  test('value zipper', async () => {
    const storeKey = 'just:test-zipper';
    delete localStorage[makeFullKey(storeKey)];

    const testAtom = atom(new Set<number>(), {
      storeKey,
      zipValue: value => ({ $: Array.from(value) }),
      unzipValue: value => new Set(value.$),
    });

    testAtom.do.add(1);

    await wait();

    expect(localStorage[makeFullKey(storeKey)]).toBe(`[{"$":[1]}]`);
    expect(Array.from(testAtom.get())).toStrictEqual([1]);
  });

  test('set() batching', async () => {
    const testAtom = atom('');

    testAtom.set('1');
    testAtom.set('2');
    testAtom.set('3');

    await wait();

    expect(testAtom.get()).toEqual('3');
    testAtom.set('#$');
    testAtom.set(prev => prev.repeat(2));
    testAtom.set(prev => prev.repeat(2));

    await wait();

    expect(testAtom.get()).toEqual('#$#$#$#$');
  });

  test('secure key', async () => {
    const testAtom = atom('', {
      storeKey: '1:1',
      securifyKeyLevel: 2,
    });

    testAtom.set('1:1');

    await wait();

    expect(localStorage[makeFullKey('1:1')]).toEqual(undefined);
    expect(localStorage[makeFullKey('JTIyMtoXjtiY')]).toEqual('["1:1"]');
    expect(testAtom.get()).toEqual('1:1');
  });

  test('secure value', async () => {
    const testAtom = atom('', {
      storeKey: '1:1',
      securifyKeyLevel: 2,
      securifyValueLevel: 2,
    });

    testAtom.set('1:1');

    await wait();

    expect(localStorage[makeFullSecureKey('1:1')]).toEqual(undefined);
    expect(localStorage[makeFullSecureKey('JTIyMtoXjtiY')]).toEqual('["JTVCJtiYmtoXjtiYjtve"]');
    expect(testAtom.get()).toEqual('1:1');
  });
});
