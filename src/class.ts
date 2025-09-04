import {
  AtomOptions,
  AtomSetDeferredMethod,
  AtomSetMethod,
  AtomStoreKey,
  AtomSubscribeMethod,
  DefaultActions,
} from '../types/model';

type Subscriber<Value> = (value: Value) => void;

export class Atom<Value, Actions extends Record<string, Function> = {}> {
  get: () => Value;
  set: AtomSetMethod<Value>;
  setDeferred: AtomSetDeferredMethod<Value>;
  reset: () => void;
  subscribe: AtomSubscribeMethod<Value>;
  defaultValue!: Value;
  do!: Actions & DefaultActions<Value>;

  constructor(defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value, Actions>) {
    let ______current_value_____ = defaultValue;
    let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
    let save: (val: Value) => void = () => {};

    const updateCurrentValue = (value: Value) => (______current_value_____ = value);
    const getCurrentValue = () => ______current_value_____;
    this.get = () => getCurrentValue();

    Object.defineProperty(this, 'do', { get: () => doFiller() });
    Object.defineProperty(this, 'defaultValue', { get: () => defaultValue });

    let doFiller = () => {
      let defaultActions: DefaultActions<any> | null = null;

      if (typeof defaultValue === 'number') {
        defaultActions = fillActions<number>(
          {
            increment: delta => {
              set((+this.get() + (delta ?? 0)) as never);
            },
          },
          defaultValue,
        );
      } else if (typeof defaultValue === 'boolean') {
        defaultActions = fillActions<boolean>(
          {
            toggle: () => {
              set(!this.get() as never);
            },
          },
          defaultValue,
        );
      } else if (Array.isArray(defaultValue)) {
        defaultActions = fillActions<any[]>(
          {
            push: (...values) => {
              set([this.get()].flat().concat(values as never) as never);
            },
            unshift: (...values) => {
              set(values.concat(this.get()) as never);
            },
            update: updater => {
              const newArray = [...(this.get() as never)];
              updater(newArray);
              set(newArray as never);
            },
            filter: filter => {
              set((this.get() as []).filter(filter ?? itIt) as never);
            },
          },
          defaultValue,
        );
      } else if (defaultValue instanceof Set) {
        defaultActions = fillActions<Set<any>>(
          {
            add: value => {
              const newSet = new Set(this.get() as never);
              newSet.add(value);
              set(newSet as never);
            },
            delete: value => {
              const newSet = new Set(this.get() as never);
              newSet.delete(value);
              set(newSet as never);
            },
            clear: () => {
              set(new Set() as never);
            },
            update: updater => {
              const newSet = new Set(this.get() as never);
              updater(newSet);
              set(newSet as never);
            },
          },
          defaultValue,
        );
      }

      const actions =
        typeof storeKeyOrOptions === 'object' && storeKeyOrOptions != null && 'do' in storeKeyOrOptions
          ? storeKeyOrOptions.do(
              () => this.get(),
              (value, isPreventSave) => set(value, isPreventSave),
            )
          : {};

      const doActions = { ...actions, ...defaultActions };

      doFiller = () => doActions;

      return doActions;
    };

    const subscribers = new Set<Subscriber<Value>>();
    const invokeSubscriber = (sub: Subscriber<Value>) => sub(this.get());
    this.subscribe = sub => {
      subscribers.add(sub);
      return () => (subscribers.delete(sub), undefined);
    };

    const set: typeof this.set = (value, isPreventSave) => {
      const val = typeof value === 'function' ? (value as (value: Value) => Value)(this.get()) : value;
      if (val === this.get() || val === undefined || (typeof val === 'number' && isNaN(val))) return;

      updateCurrentValue(val);
      subscribers.forEach(invokeSubscriber, this);

      try {
        updateHere.postMessage({ key, value: getCurrentValue() });
      } catch (e) {}

      if (isPreventSave !== true) {
        save(val);
      }
    };
    this.set = (value, isPreventSave) => set(value, isPreventSave);

    this.reset = () => {
      set(defaultValue, true);
      subscribers.forEach(invokeSubscriber, this);
    };

    this.setDeferred = (value, debounceMs = 500, isPreventSave, isInitInvoke = true) => {
      if (isInitInvoke && debounceTimeout === undefined) set(value, isPreventSave);

      clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(() => {
        set(value, isPreventSave);
        debounceTimeout = undefined;
      }, debounceMs);
    };

    if (storeKeyOrOptions == null) return;
    ////////////////////////
    //////////////////////// storaged value
    ////////////////////////

    let storeKey = null;
    let warnOnDuplicateStoreKey = true;
    let listenStorageChanges = true;
    let isUnchangable = false;

    let parseValue: AtomOptions<Value, Actions>['parseValue'] =
      defaultValue instanceof Set ? strValue => new Set(JSON.parse(strValue)) : strValue => JSON.parse(strValue);

    let stringifyValue: AtomOptions<Value, Actions>['stringifyValue'] =
      defaultValue instanceof Set
        ? val => {
            if (val instanceof Set) return JSON.stringify(Array.from(val));

            console.error(val);
            throw 'The value is not Set instance';
          }
        : value => JSON.stringify(value);

    if (typeof storeKeyOrOptions === 'string') {
      storeKey = storeKeyOrOptions;
    } else if ('storeKey' in storeKeyOrOptions) {
      warnOnDuplicateStoreKey = storeKeyOrOptions.warnOnDuplicateStoreKey ?? warnOnDuplicateStoreKey;
      listenStorageChanges = storeKeyOrOptions.listenStorageChanges ?? listenStorageChanges;
      storeKey = storeKeyOrOptions.storeKey;

      parseValue = storeKeyOrOptions.parseValue ?? parseValue;
      stringifyValue = storeKeyOrOptions.stringifyValue ?? stringifyValue;
      isUnchangable = storeKeyOrOptions.unchangable ?? isUnchangable;
    }

    if (storeKey === null) return;

    const key = `atom/${storeKey}`;
    let isInactualValue = true;

    this.get = () => {
      this.get = () => getCurrentValue();

      if (isInactualValue) {
        isInactualValue = false;
        try {
          updateCurrentValue(key in localStorage ? parseValue(localStorage[key]) : defaultValue);
        } catch (e) {
          console.warn('Invalid json value', localStorage[key]);
        }
      }

      return getCurrentValue();
    };

    save = value => {
      if (value === defaultValue) {
        this.reset();
        return;
      }
      localStorage[key] = stringifyValue(value);
    };

    this.reset = () => {
      delete localStorage[key];
      set(defaultValue, true);
    };

    if (warnOnDuplicateStoreKey && update[key] !== undefined) console.warn('Duplicate Atom key', storeKey);

    if (listenStorageChanges) {
      if (isUnchangable) {
        let isCantChange = false;
        let timeout: ReturnType<typeof setTimeout>;

        unchangableAtoms[key] = this as never;
        update[key] = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => (isCantChange = false), 10);

          if (isCantChange) return;
          isCantChange = true;

          localStorage[key] = stringifyValue(getCurrentValue());
        };
      } else
        update[key] = event => {
          if (event.newValue === null) {
            this.reset();
            return;
          }

          try {
            set(parseValue(event.newValue));
          } catch (_e) {
            console.warn('Invalid json value', event.newValue);
          }
        };
    }
  }
}

let updateHere: BroadcastChannel;
try {
  updateHere = new BroadcastChannel('updateHere');
  updateHere.addEventListener('message', event => {
    unchangableAtoms[event.data.key]?.set(event.data.value, true);
  });
} catch (e) {}

const localStorage = window.localStorage;
const update: Partial<Record<string, (event: StorageEvent) => void>> = {};
const unchangableAtoms: Partial<Record<string, Atom<unknown>>> = {};
const itIt = <It>(it: It) => it;
const fillActions = <Value>(actions: DefaultActions<Value>, _value: Value) => actions;

window.addEventListener('storage', event => {
  if (event.key === null || event.newValue === event.oldValue) return;
  update[event.key]?.(event);
});

const setItem = localStorage.setItem.bind(localStorage);
const removeItem = localStorage.removeItem.bind(localStorage);

localStorage.setItem = (key, value) => {
  if (unchangableAtoms[key] !== undefined) return;
  setItem.call(localStorage, key, value);
};
localStorage.removeItem = key => {
  if (unchangableAtoms[key] !== undefined) return;
  removeItem.call(localStorage, key);
};
