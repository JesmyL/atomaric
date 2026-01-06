import { useSyncExternalStore } from 'react';
import { atom, configureAtomaric } from '../lib';
import { makeFullKey, wait } from '../utils';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

describe('Map', () => {
  type Value = number | { asasa: '' };
  const testAtom = atom(new Map<string, Value>(), {
    storeKey: 'map:test',
    do: (set, get) => ({
      filterKeyValues: () => {
        const newMap = new Map();
        get().forEach((value, key) => {
          if (value) newMap.set(key, value);
        });
        set(newMap);
      },
    }),
  });

  test('do.setValue()', async () => {
    testAtom.do.setValue('!', 1);
    testAtom.do.setValue('@', 0);
    testAtom.do.setValue('#', { asasa: '' });
    testAtom.do.setValue('', 123);
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[["!",1],["@",0],["#",{"asasa":""}],["",123]]]');

    expect(testAtom.get()).toEqual(
      new Map<string, Value>([
        ['!', 1],
        ['@', 0],
        ['#', { asasa: '' }],
        ['', 123],
      ]),
    );
  });

  test('do.<filterKeyValues>()', async () => {
    testAtom.do.filterKeyValues();
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[["!",1],["#",{"asasa":""}],["",123]]]');
  });

  test('do.delete()', async () => {
    testAtom.do.delete('#');
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[["!",1],["",123]]]');
  });

  test('do.toggle()', async () => {
    testAtom.do.toggle('#', 555);
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[["!",1],["",123],["#",555]]]');

    testAtom.do.toggle('', 999);
    testAtom.do.toggle('!', 1234567890);
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[["#",555]]]');
  });

  test('do.clear()', async () => {
    testAtom.do.clear();
    await wait();

    expect(localStorage[makeFullKey('map:test')]).toEqual('[[]]');
  });
});
