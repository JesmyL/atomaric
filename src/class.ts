import { AtomOptions, AtomSetDeferredMethod, AtomSetMethod, AtomStoreKey, AtomSubscribeMethod } from '../types/model';

type Subscriber<Value> = (value: Value) => void;

const updaters: Record<string, (event: StorageEvent) => void> = {};

window.addEventListener('storage', event => {
  if (event.key === null || updaters[event.key] === undefined) return;
  updaters[event.key](event);
});

export class Atom<Value> {
  private value: Value;
  private debounceTimeout?: ReturnType<typeof setTimeout>;
  private readonly subscribers = new Set<Subscriber<Value>>();
  private readonly save: (val: Value) => void = () => {};
  private readonly invokeSubscriber = (sub: Subscriber<Value>) => sub(this.value);

  constructor(private _defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value>) {
    this.value = _defaultValue;
    if (typeof _defaultValue !== 'boolean') this.toggle = () => {};
    if (typeof _defaultValue !== 'number') this.inkrement = () => {};

    this.reset = () => {
      this.set(_defaultValue, true);
      this.subscribers.forEach(this.invokeSubscriber, this);
    };

    if (storeKeyOrOptions == null) return;

    let storeKey = null;
    let warnOnDuplicateStoreKey = true;
    let listenStorageChanges = true;
    let isUnchangable = false;

    let parseValue: AtomOptions<Value>['parseValue'] =
      _defaultValue instanceof Set ? strValue => new Set(JSON.parse(strValue)) : strValue => JSON.parse(strValue);

    let stringifyValue: AtomOptions<Value>['stringifyValue'] =
      _defaultValue instanceof Set
        ? val => {
            if (val instanceof Set) return JSON.stringify(Array.from(val));

            console.error(val);
            throw 'The value is not Set instance';
          }
        : value => JSON.stringify(value);

    if (typeof storeKeyOrOptions === 'string') {
      storeKey = storeKeyOrOptions;
    } else if (storeKeyOrOptions.storeKey !== undefined) {
      warnOnDuplicateStoreKey = storeKeyOrOptions.warnOnDuplicateStoreKey ?? true;
      listenStorageChanges = storeKeyOrOptions.listenStorageChanges ?? true;
      storeKey = storeKeyOrOptions.storeKey;

      parseValue = storeKeyOrOptions.parseValue ?? parseValue;
      stringifyValue = storeKeyOrOptions.stringifyValue ?? stringifyValue;
      isUnchangable = storeKeyOrOptions.unchangable ?? isUnchangable;
    }

    if (storeKey === null) return;

    const key = `atom/${storeKey}`;
    let isInactualValue = true;

    this.get = () => {
      this.get = () => this.value;

      if (isInactualValue) {
        isInactualValue = false;
        try {
          this.value = key in localStorage ? parseValue(localStorage[key]) : _defaultValue;
        } catch (e) {
          console.warn('Invalid json value', localStorage[key]);
        }
      }

      return this.value;
    };

    this.save = value => {
      if (value === _defaultValue) {
        this.reset();
        return;
      }
      localStorage[key] = stringifyValue(value);
    };

    this.reset = () => {
      delete localStorage[key];
      this.set(_defaultValue, true);
    };

    if (warnOnDuplicateStoreKey && updaters[key] !== undefined)
      console.warn(
        'Duplicate Atom key',
        typeof storeKeyOrOptions === 'string' ? storeKeyOrOptions : storeKeyOrOptions.storeKey,
      );

    if (listenStorageChanges)
      updaters[key] = isUnchangable
        ? () => (localStorage[key] = stringifyValue(this.value))
        : event => {
            if (event.newValue === null) {
              this.reset();
              return;
            }

            try {
              this.set(parseValue(event.newValue));
            } catch (_e) {
              console.warn('Invalid json value', event.newValue);
            }
          };
  }

  get defaultValue() {
    return this._defaultValue;
  }

  get = () => this.value;
  readonly reset: () => void;
  readonly toggle = () => this.set(!this.value as never);
  readonly inkrement = (delta: number) => this.set(((this.value as number) + delta) as never);

  readonly subscribe: AtomSubscribeMethod<Value> = sub => {
    this.subscribers.add(sub);
    return () => {
      this.subscribers.delete(sub);
    };
  };

  readonly set: AtomSetMethod<Value> = (value, isPreventSave) => {
    const val = typeof value === 'function' ? (value as (value: Value) => Value)(this.value) : value;
    if (val === this.value || val === undefined || (typeof val === 'number' && isNaN(val))) return;

    this.value = val;
    this.subscribers.forEach(this.invokeSubscriber, this);

    if (isPreventSave !== true) this.save(val);
  };

  readonly setDeferred: AtomSetDeferredMethod<Value> = (
    value,
    debounceMs = 500,
    isPreventSave,
    isInitInvoke = true,
  ) => {
    if (isInitInvoke && this.debounceTimeout === undefined) this.set(value, isPreventSave);

    clearTimeout(this.debounceTimeout);

    this.debounceTimeout = setTimeout(() => {
      this.set(value, isPreventSave);
      delete this.debounceTimeout;
    }, debounceMs);
  };
}
