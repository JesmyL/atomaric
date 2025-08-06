import { AtomOptions, AtomStoreKey } from '../types/model';

type Subscriber<Value> = (value: Value) => void;

const updaters: Record<string, (event: StorageEvent) => void> = {};

window.addEventListener('storage', event => {
  if (event.key === null || updaters[event.key] === undefined) return;
  updaters[event.key](event);
});

export class Atom<Value> {
  private value: Value;
  private readonly subscribers = new Set<Subscriber<Value>>();
  private readonly save: (val: Value) => void = () => {};
  private readonly invokeSubscriber = (sub: Subscriber<Value>) => sub(this.value);

  constructor(private _defaultValue: Value, storeKeyOrOptons: AtomStoreKey | undefined | AtomOptions) {
    this.value = _defaultValue;
    if (typeof _defaultValue !== 'boolean') this.toggle = () => {};
    if (typeof _defaultValue !== 'number') this.inkrement = () => {};

    this.reset = () => {
      this.set(_defaultValue, true);
      this.subscribers.forEach(this.invokeSubscriber, this);
    };

    if (storeKeyOrOptons == null) return;

    let storeKey = null;
    let warnOnDuplicateStoreKey = true;
    let listenStorageChanges = true;

    if (typeof storeKeyOrOptons === 'string') {
      storeKey = storeKeyOrOptons;
    } else if (storeKeyOrOptons.storeKey !== undefined) {
      warnOnDuplicateStoreKey = storeKeyOrOptons.warnOnDuplicateStoreKey ?? true;
      listenStorageChanges = storeKeyOrOptons.listenStorageChanges ?? true;
      storeKey = storeKeyOrOptons.storeKey;
    }

    if (storeKey === null) return;

    const key = `atom/${storeKey}`;

    this.value = key in localStorage ? JSON.parse(localStorage[key]) : _defaultValue;
    this.save = value => {
      if (value === _defaultValue) {
        this.reset();
        return;
      }
      localStorage[key] = JSON.stringify(value);
    };

    this.reset = () => {
      delete localStorage[key];
      this.set(_defaultValue, true);
    };

    if (warnOnDuplicateStoreKey && updaters[key] !== undefined) console.warn('Duplicate Atom key', storeKeyOrOptons);

    if (listenStorageChanges)
      updaters[key] = event => {
        if (event.newValue === null) {
          this.reset();
          return;
        }

        try {
          this.set(JSON.parse(event.newValue));
        } catch (_e) {
          console.warn('Invalid json value', event.newValue);
        }
      };
  }

  get defaultValue() {
    return this._defaultValue;
  }

  readonly get = () => this.value;
  readonly reset: () => void;
  readonly toggle = () => this.set(!this.value as never);
  readonly inkrement = (delta: number) => this.set(((this.value as number) + delta) as never);

  readonly subscribe = (sub: Subscriber<Value>) => {
    this.subscribers.add(sub);
    return () => {
      this.subscribers.delete(sub);
    };
  };

  readonly set = (value: Value | ((prev: Value) => Value), isPreventSave?: boolean) => {
    const val = typeof value === 'function' ? (value as (value: Value) => Value)(this.value) : value;
    if (val === this.value || val === undefined || (typeof val === 'number' && isNaN(val))) return;

    this.value = val;
    this.subscribers.forEach(this.invokeSubscriber, this);

    if (isPreventSave !== true) this.save(val);
  };
}
