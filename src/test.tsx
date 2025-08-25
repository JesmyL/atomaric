import React, { useEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { atom, configureAtomaric, useAtomValue } from './hooks';

configureAtomaric({ useSyncExternalStore });

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const testAtom = atom(new Set<string>(), 'test:set');

function App() {
  const test = useAtomValue(testAtom);

  console.info(test);

  useEffect(() => {
    const onClick = () => {
      const newValue = new Set(testAtom.get());
      newValue.add(`${Date.now()}`);

      testAtom.set(newValue);
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return <></>;
}
