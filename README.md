## 🕹️Installation and usage

```sh
npm install atomaric
```

### usage

```tsx
import { atom, useAtom, configureAtomaric } from 'atomaric';
import { useSyncExternalStore } from 'react';

configureAtomaric({ useSyncExternalStore }); // do this before all

const nameAtom = atom(
  'World',
  'greats:name', // optional locakStorage key
);

function App() {
  const [name, setIsOpen] = useAtom(nameAtom);

  return (
    <div onClick={() => setIsOpen(isOpen => (name === 'World' ? 'Man' : 'World'))}>
      Hello <span className="color-accent">{name}</span>
    </div>
  );
}
```
