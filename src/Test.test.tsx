import { render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { AtomSecureLevel } from './class';
import { atom, configureAtomaric, useAtomValue } from './lib';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

const wait = (timeout = 300) => new Promise(res => setTimeout(res, timeout));
const makeKey = <StoreKey extends string>(storeKey: StoreKey) => `atom\\${storeKey}`;
const makeSecureKey = <StoreKey extends string>(storeKey: StoreKey) => `atom\`s\\${storeKey}`;

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
    delete localStorage[makeKey(storeKey)];

    const testAtom = atom(new Set<number>(), storeKey);

    testAtom.do.add(1);

    await wait(1);

    expect(localStorage[makeKey(storeKey)]).toBe('[[1]]');
  });

  test('save in localStorage with expire time', async () => {
    const storeKey = 'just:test-with-exp';
    delete localStorage[makeKey(storeKey)];
    const date = new Date(Date.now() + 2 * 1000);

    const testAtom = atom(new Set<number>(), {
      storeKey,
      exp: () => date,
    });

    testAtom.do.add(1);

    const storagedVal = `[[1],{"exp":${Math.trunc(date.getTime() / 1000)}}]`;

    await wait(1);
    expect(localStorage[makeKey(storeKey)]).toBe(storagedVal);

    await wait(1100);
    expect(localStorage[makeKey(storeKey)]).toBe(storagedVal);

    await wait(2100);
    expect(localStorage[makeKey(storeKey)]).toBe(undefined);
  });

  test('value zipper', async () => {
    const storeKey = 'just:test-zipper';
    delete localStorage[makeKey(storeKey)];

    const testAtom = atom(new Set<number>(), {
      storeKey,
      zipValue: value => ({ $: Array.from(value) }),
      unzipValue: value => new Set(value.$),
    });

    testAtom.do.add(1);

    await wait(1);

    expect(localStorage[makeKey(storeKey)]).toBe(`[{"$":[1]}]`);
    expect(Array.from(testAtom.get())).toStrictEqual([1]);
  });

  test('Object.do.setDeepPartial()', async () => {
    const b = { c: [{ d: 8, e: 'e', f: 'F', g: { h: 'HHH' } }] };
    const a = { f: { g: '' }, b };
    const testAtom = atom({ a, b });

    testAtom.do.setDeepPartial('b.c.0.d', 123, { b: { c: [{}] } });

    await wait(1);

    expect(testAtom.get().b).not.toEqual(b);
    expect(testAtom.get().b.c[0].d).toEqual(123);
    expect(testAtom.get().b.c).not.toEqual(b.c);
    expect(testAtom.get().a).toEqual(a);

    testAtom.do.setDeepPartial('b+c+8+e', 'EE', null, '+');

    await wait(1);

    expect(testAtom.get().b.c[8].e).toEqual('EE');
  });

  test('Object.do.setDeepPartial() with first numeric prop', async () => {
    enum Num {
      num = 123,
    }
    const testAtom = atom({ [Num.num]: { a: 'A' } });

    testAtom.do.setDeepPartial(`${Num.num}.a`, 'AA', { [Num.num]: {} });

    await wait(1);

    expect(testAtom.get()[Num.num].a).toEqual('AA');
  });

  test('Object.do.update()', async () => {
    const init = { a: { b: { c: { d: { e: 'E' } }, f: { g: {} } }, h: { i: { j: {} } } } };
    const testAtom = atom(init);

    testAtom.do.update(obj => (obj.a.b.c.d.e = 'eE'));

    await wait(1);

    expect(testAtom.get().a.b.c.d.e).toEqual('eE');
    expect(testAtom.get().a.b.c).not.toEqual(init.a.b.c);
    expect(testAtom.get().a.h.i).toEqual(init.a.h.i);
  });

  test('set() batching', async () => {
    const testAtom = atom('');

    testAtom.set('1');
    testAtom.set('2');
    testAtom.set('3');

    await wait(1);

    expect(testAtom.get()).toEqual('3');
    testAtom.set('#$');
    testAtom.set(prev => prev.repeat(2));
    testAtom.set(prev => prev.repeat(2));

    await wait(1);

    expect(testAtom.get()).toEqual('#$#$#$#$');
  });

  test('secure key', async () => {
    const testAtom = atom('', {
      storeKey: '1:1',
      securifyKeyLevel: AtomSecureLevel.Middle,
    });

    testAtom.set('1:1');

    await wait(1);

    expect(localStorage[makeKey('1:1')]).toEqual(undefined);
    expect(localStorage[makeKey('JTIyMtoXjtiY')]).toEqual('["1:1"]');
    expect(testAtom.get()).toEqual('1:1');
  });

  test('secure value', async () => {
    const testAtom = atom('', {
      storeKey: '1:1',
      securifyKeyLevel: AtomSecureLevel.Middle,
      securifyValueLevel: AtomSecureLevel.Middle,
    });

    testAtom.set('1:1');

    await wait(1);

    expect(localStorage[makeSecureKey('1:1')]).toEqual(undefined);
    expect(localStorage[makeSecureKey('JTIyMtoXjtiY')]).toEqual('["JTVCJtiYmtoXjtiYjtve"]');
    expect(testAtom.get()).toEqual('1:1');
  });
});
