import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Object', () => {
  test('do.setDeepPartial()', async () => {
    const b = { c: [{ d: 8, e: 'e', f: 'F', g: { h: 'HHH' } }] };
    const a = { f: { g: '' }, b };
    const testAtom = atom({ a, b });

    testAtom.do.setDeepPartial('b.c.0.d', 123, { b: { c: [{}] } });

    await wait();

    expect(testAtom.get().b).not.toEqual(b);
    expect(testAtom.get().b.c[0].d).toEqual(123);
    expect(testAtom.get().b.c).not.toEqual(b.c);
    expect(testAtom.get().a).toEqual(a);

    testAtom.do.setDeepPartial('b+c+8+e', 'EE', null, '+');

    await wait();

    expect(testAtom.get().b.c[8].e).toEqual('EE');
  });

  test('do.setDeepPartial() with first numeric prop', async () => {
    enum Num {
      num = 123,
    }
    const testAtom = atom({ [Num.num]: { a: 'A' } });

    testAtom.do.setDeepPartial(`${Num.num}.a`, 'AA', { [Num.num]: {} });

    await wait();

    expect(testAtom.get()[Num.num].a).toEqual('AA');
  });

  test('do.setPartial()', async () => {
    const testAtom = atom((): Record<number, unknown> => ({ 2: { a: 'A' } }));

    testAtom.do.setPartial({ 3: { b: 'B' } });
    testAtom.do.setPartial({ 4: [] });
    await wait();

    expect(testAtom.get()).toEqual({ 2: { a: 'A' }, 3: { b: 'B' }, 4: [] });
  });

  test('do.update()', async () => {
    const init = { a: { b: { c: { d: { e: 'E' } }, f: { g: {} } }, h: { i: { j: {} } } } };
    const testAtom = atom(init);

    testAtom.do.update(obj => (obj.a.b.c.d.e = 'eE'));

    await wait();

    expect(testAtom.get().a.b.c.d.e).toEqual('eE');
    expect(testAtom.get().a.b.c).not.toEqual(init.a.b.c);
    expect(testAtom.get().a.h.i).toEqual(init.a.h.i);
  });
});
