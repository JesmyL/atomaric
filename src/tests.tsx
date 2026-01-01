import React, { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { AtomSecureLevel } from './class';
import { atom, configureAtomaric } from './lib';

configureAtomaric({
  useSyncExternalStore,
  keyPathSeparator: '.',
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const testAtom = atom('', {
  storeKey: '1:1',
  securifyKeyLevel: AtomSecureLevel.Middle,
  securifyValueLevel: AtomSecureLevel.Middle,
});

testAtom.set('1:1');

function App() {
  return <></>;
}
