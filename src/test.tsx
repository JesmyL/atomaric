import React, { useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { atom, configureAtomaric, useAtomValue } from './hooks';

configureAtomaric({ useSyncExternalStore });

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const testAtom = atom(new Set<number>(), {
  storeKey: 'test:set',
  do: (get, set) => ({
    update2: () => set(new Set(get()).add(12)),
  }),
});

const testTextAtom = atom('', {
  storeKey: 'test:text',
  unchangable: true,
  do: (get, set) => ({
    addText: (text: string) => {
      set(get() + text);
    },
  }),
});

const array: (number | '')[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const arrayAtom = atom(array, {
  do: () => ({
    push2: () => {},
  }),
});

console.info(arrayAtom.get());
arrayAtom.do.push(0);
arrayAtom.do.push2();
console.info(arrayAtom.get());
arrayAtom.do.unshift(-1);
console.info(arrayAtom.get());
arrayAtom.do.filter();
console.info(arrayAtom.get());

atom(0, 'a:a');
atom(0, { storeKey: 'a:a' });
atom(0, { storeKey: 'a:a', warnOnDuplicateStoreKey: false });

function App() {
  const test = useAtomValue(testAtom);
  const testText = useAtomValue(testTextAtom);

  console.info(test);

  useEffect(() => {
    const onClick = () => {
      testAtom.do.add(Date.now());
      testAtom.do.update2();
      testTextAtom.do.addText('1');
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return <>{testText}</>;
}
