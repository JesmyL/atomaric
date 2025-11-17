import React, { useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { atom, configureAtomaric, useAtomDo, useAtomValue } from './lib';

configureAtomaric({ useSyncExternalStore });

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

console.log(Object.keys(arrayAtom));
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
  const a = { f: { g: '' } };
  const b = { c: [{ d: 8, e: 'e', f: 'F' }] };
  const deepTest = atom({ a, b });

  deepTest.do.setDeepPartial('b.c.0.d', 123);
  deepTest.do.setDeepPartial('b+c+8+e', 'EE', '+');

  console.log(deepTest.get(), deepTest.get().a.f === a.f, deepTest.get().b.c === b.c);
})();

function App() {
  const test = useAtomValue(testAtom);
  const testText = useAtomValue(testTextAtom);
  const testDo = useAtomDo(testAtom);

  console.info(test);

  useEffect(() => {
    const onClick = () => {
      testDo.add(Date.now());
      testDo.update12();
      testTextAtom.do.addText('1');
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return <>{testText}</>;
}
