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
  do: (get, set) => ({
    update12: () => set(new Set(get()).add(12)),
  }),
});

const testTextAtom = atom('', {
  storeKey: 'test:text',
  stringifyValue: value => JSON.stringify({ value }),
  parseValue: string => JSON.parse(string).value,
  do: (get, set) => ({
    addText: (text: string) => {
      set(get() + text);
    },
  }),
});

const array: (number | '')[] = [3, 1, 7, 4, 8, 9, 5];
const arrayAtom = atom(array, {
  do: () => ({
    nothing: () => {},
  }),
});

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
