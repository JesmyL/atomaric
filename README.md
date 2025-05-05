## 🕹️Installation and usage

```sh
npm install atomaric
```

### usage

```ts
import { atom, useAtomValue } from 'atomaric';

const nameAtom = atom('World');

function App() {
  const [name, setIsOpen] = useAtomValue(nameAtom);

  return <div onClick={() => setIsOpen(isOpen => (name === 'World' ? 'Man' : 'World'))}>Hello, {name}</div>;
}
```
