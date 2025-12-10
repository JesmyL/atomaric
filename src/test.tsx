import React, { useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { atom, configureAtomaric, useAtomDo, useAtomValue } from './lib';

configureAtomaric({ useSyncExternalStore, keyPathSeparator: '.' });

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const testAtom = atom(new Set<number>(), {
  storeKey: 'test:set',
  do: set => ({
    update12: () => set(prev => new Set(prev).add(12)),
  }),
});

const testTextAtom = atom('', {
  storeKey: 'test:text',
  unchangable: true,
  exp: () => new Date(Date.now() + 3 * 1000),

  zipValue: value => ({ value }),
  unzipValue: val => val.value,

  do: set => ({
    addText: (text: string) => {
      set(prev => prev + text);
    },
  }),
});

const array: (number | '')[] = [3, 1, 7, 4, 8, 9, 5];
const arrayAtom = atom(array, {
  do: () => ({
    nothing: () => {},
  }),
});

console.info(Object.keys(arrayAtom));
// arrayAtom.do.filter = {};

console.info(arrayAtom);
arrayAtom.do.push(0);
arrayAtom.do.nothing();
console.info(arrayAtom.get());
arrayAtom.do.unshift(-1);
console.info(arrayAtom.get());
arrayAtom.do.update(arr => arr.sort());
console.info(arrayAtom.get());
arrayAtom.do.filter();
console.info(arrayAtom.get());

atom(0, 'a:a');
atom(0, { storeKey: 'a:a' });
atom(0, { storeKey: 'a:a', warnOnDuplicateStoreKey: false });

(function testDeepPartialChanges() {
  const b = { c: [{ d: 8, e: 'e', f: 'F' }] };
  const a = { f: { g: '' }, b };
  const deepTest = atom({ a, b });

  deepTest.do.setDeepPartial('b.c.0.d', 123, { b: { c: [{}] } });
  deepTest.do.setDeepPartial('b+c+8+e', 'EE', null, '+');

  console.info(deepTest.get(), deepTest.get().a.f === a.f, deepTest.get().b.c === b.c);
})();

(function testDeepPartialChanges() {
  const enum Id {
    def = 0,
  }

  const deepTest = atom(
    {} as Record<
      Id,
      {
        in: { inin: [{ ininin: number }] }[];
        out: { some: { req: 0 } };
        else: { if: {} };
      }
    >,
  );

  deepTest.do.setDeepPartial(`${Id.def}.in.${9}.inin.0`, { ininin: 9 }, { [Id.def]: { in: [{ inin: [] }] } });
  console.info('Id.def', deepTest.get());

  deepTest.do.setDeepPartial(`${Id.def}+in+ 4 +inin+0+ininin`, () => 7, { [Id.def]: { in: [{ inin: [{}] }] } }, '+');
  console.info('Id.def', deepTest.get());

  // will throw
  // console.error(deepTest.get()[Id.def]?.out.some.req);
})();

(function testDeepPartialSetWithDonor() {
  const a: {
    val: {
      b?: { c?: { f: { g?: { e: string } }[] }[] };
      f: { l: number; g?: number };
    };
  } = { val: { f: { l: 9 } } };

  const deepTest = atom(a);

  deepTest.do.setDeepPartial('val.b.c.4.f', [{ g: { e: '^' } }], { val: { b: { c: [{}] } } });
  deepTest.do.setDeepPartial('val.b.c.4.f.5.g', { e: '!!@' }, { val: { b: { c: [{ f: [{}] }] } } });
  deepTest.do.setDeepPartial('val.b.c.4.f.2', { g: { e: '2' } }, { val: { b: { c: [{ f: [] }] } } });
  deepTest.do.setDeepPartial('val.b.c.4.f.5.g.e', 'FIVE', { val: { b: { c: [{ f: [{ g: {} }] }] } } });
  deepTest.do.setDeepPartial('val.f.l', 123, { val: { f: {} } });

  deepTest.do.setDeepPartial('val***f***g', 777, { val: { f: {} } }, '***');

  console.info(deepTest.get());
})();

(function testUpdate() {
  const a: {
    val: {
      b: { c: { f: { g: { e: string } }[] }[] };
    };
    f: { l: { v: { r: number } }; g?: number };
    num: number;
  } = {
    val: { b: { c: [{ f: [{ g: { e: '1' } }] }] } },
    f: { l: { v: { r: 8 } } },
    num: 8,
  };

  const updateTest = atom(a);

  const prevF = a.val.b.c[0].f;
  const prevV = a.f.l.v;

  console.info(updateTest.get() === a);

  updateTest.do.update(a => {
    a.val.b.c[0].f[0].g.e = '2';
    // a.num = 0;
  });
  console.info(
    updateTest.get() === a,
    prevF === a.val.b.c[0].f,
    prevV === updateTest.get().f.l.v,
    updateTest.get().val.b.c[0].f === a.val.b.c[0].f,
    a.val.b.c[0].f[0].g,
    updateTest.get().val.b.c[0].f[0].g,
  );
})();

const numAtom = atom(0);

function App() {
  const test = useAtomValue(testAtom);
  const testText = useAtomValue(testTextAtom);
  const testDo = useAtomDo(testAtom);
  console.log({ num: useAtomValue(numAtom) });

  console.info(test);

  useEffect(() => {
    const onClick = () => {
      testDo.add(Date.now());
      testDo.update12();
      testTextAtom.do.addText('1');

      numAtom.set(num => {
        console.log(num);
        return 1;
      });
      numAtom.set(3);
      numAtom.set(num => {
        console.log(num);
        return 4;
      });
      numAtom.set(num => {
        console.log(num);
        return 5;
      });
      numAtom.set(6);
      numAtom.set(num => {
        console.log(num);
        return 7;
      });
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return <>{testText}</>;
}
