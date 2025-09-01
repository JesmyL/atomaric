import {
  AtomOptions,
  AtomSetDeferredMethod,
  AtomSetMethod,
  AtomStoreKey,
  AtomSubscribeMethod,
  DefaultActions,
} from '../types/model';
import { SuperAtom } from './super.class';

type Subscriber<Value> = (value: Value) => void;

export class Atom<Value, Actions extends Record<string, Function>> extends SuperAtom<Value> {
  private debounceTimeout?: ReturnType<typeof setTimeout>;
  private readonly subscribers = new Set<Subscriber<Value>>();
  private readonly save: (val: Value) => void = () => {};
  private readonly invokeSubscriber = (sub: Subscriber<Value>) => sub(this.get());
  do = {} as Actions & DefaultActions<Value>;

  constructor(private _defaultValue: Value, storeKeyOrOptions: AtomStoreKey | undefined | AtomOptions<Value, Actions>) {
    super(_defaultValue);

    const fillActions = <Value>(_value: Value, actions: DefaultActions<Value>): DefaultActions<Value> & Actions => {
      return actions as never;
    };

    let defaultActions: (DefaultActions<any> & Actions) | null = null;

    if (typeof _defaultValue === 'number') {
      defaultActions = fillActions<number>(_defaultValue, {
        increment: delta => {
          this.set((+this.get() + (delta ?? 0)) as never);
        },
      });
    }

    if (typeof _defaultValue === 'boolean') {
      defaultActions = fillActions<boolean>(_defaultValue, {
        toggle: () => {
          this.set(!this.get() as never);
        },
      });
    }

    if (Array.isArray(_defaultValue)) {
      defaultActions = fillActions<any[]>(_defaultValue, {
        push: value => {
          this.set([...(this.get() as never), value] as never);
        },
        unshift: value => {
          this.set([value, ...(this.get() as never)] as never);
        },
        update: updater => {
          const newArray = [...(this.get() as never)];
          updater(newArray);
          this.set(newArray as never);
        },
        filter: filter => {
          this.set((this.get() as []).filter(filter ?? itIt) as never);
        },
      });
    }

    if (_defaultValue instanceof Set) {
      defaultActions = fillActions<Set<any>>(_defaultValue, {
        add: value => {
          const newSet = new Set(this.get() as never);
          newSet.add(value);
          this.set(newSet as never);
        },
        delete: value => {
          const newSet = new Set(this.get() as never);
          newSet.delete(value);
          this.set(newSet as never);
        },
        clear: () => {
          this.set(new Set() as never);
        },
        update: updater => {
          const newSet = new Set(this.get() as never);
          updater(newSet);
          this.set(newSet as never);
        },
      });
    }

    const actions =
      typeof storeKeyOrOptions === 'object' && 'do' in storeKeyOrOptions
        ? storeKeyOrOptions.do(
            () => this.get(),
            (value, isPreventSave) => this.set(value, isPreventSave),
          )
        : {};

    this.do = {
      ...actions,
      ...(defaultActions as DefaultActions<Value> & Actions),
    };

    this.reset = () => {
      this.set(_defaultValue, true);
      this.subscribers.forEach(this.invokeSubscriber, this);
    };

    if (storeKeyOrOptions == null) return;

    let storeKey = null;
    let warnOnDuplicateStoreKey = true;
    let listenStorageChanges = true;
    let isUnchangable = false;

    let parseValue: AtomOptions<Value, Actions>['parseValue'] =
      _defaultValue instanceof Set ? strValue => new Set(JSON.parse(strValue)) : strValue => JSON.parse(strValue);

    let stringifyValue: AtomOptions<Value, Actions>['stringifyValue'] =
      _defaultValue instanceof Set
        ? val => {
            if (val instanceof Set) return JSON.stringify(Array.from(val));

            console.error(val);
            throw 'The value is not Set instance';
          }
        : value => JSON.stringify(value);

    if (typeof storeKeyOrOptions === 'string') {
      storeKey = storeKeyOrOptions;
    } else if ('storeKey' in storeKeyOrOptions) {
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
      this.get = () => super.getValue();

      if (isInactualValue) {
        isInactualValue = false;
        try {
          super.setValue(key in localStorage ? parseValue(localStorage[key]) : _defaultValue);
        } catch (e) {
          console.warn('Invalid json value', localStorage[key]);
        }
      }

      return super.getValue();
    };

    this.save = value => {
      if (value === _defaultValue) {
        this.reset();
        return;
      }
      localStorage[key] = stringifyValue(value);
      postChanged(key);
    };

    this.reset = () => {
      delete localStorage[key];
      this.set(_defaultValue, true);
    };

    if (warnOnDuplicateStoreKey && methods[key] !== undefined) console.warn('Duplicate Atom key', storeKey);

    methods[key] = {};

    if (listenStorageChanges) {
      if (isUnchangable) {
        let timeout: ReturnType<typeof setTimeout>;
        let isCantUpdate = false;

        methods[key].updateUnchangable = () => {
          try {
            this.set(parseValue(localStorage[key]), true);
          } catch (e) {}
        };

        unchangables[key] = () => {
          if (isCantUpdate) return;
          isCantUpdate = true;
          localStorage[key] = stringifyValue(this.get());
          clearTimeout(timeout);
          timeout = setTimeout(() => (isCantUpdate = false), 100);
        };

        startUnchangableChangesDetection();
      } else {
        methods[key].updatable = event => {
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
    }
  }

  get defaultValue() {
    return this._defaultValue;
  }

  get = () => super.getValue();
  readonly reset: () => void;

  readonly subscribe: AtomSubscribeMethod<Value> = sub => {
    this.subscribers.add(sub);
    return () => {
      this.subscribers.delete(sub);
    };
  };

  readonly set: AtomSetMethod<Value> = (value, isPreventSave) => {
    const val = typeof value === 'function' ? (value as (value: Value) => Value)(this.get()) : value;
    if (val === this.get() || val === undefined || (typeof val === 'number' && isNaN(val))) return;

    super.setValue(val);
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

const localStorage = window.localStorage;
const methods: Partial<
  Record<
    string,
    {
      updateUnchangable?: () => void;
      updatable?: (event: StorageEvent) => void;
    }
  >
> = {};

const unchangables: Partial<Record<string, () => void>> = {};

window.addEventListener('storage', event => {
  if (event.key === null || event.newValue === event.oldValue) return;
  unchangables[event.key]?.();
  methods[event.key]?.updatable?.(event);
});

const unchangableChangedChannel = new BroadcastChannel('unchangableChanged');

unchangableChangedChannel.addEventListener('message', event => {
  methods[event.data]?.updateUnchangable?.();
});

const postChanged = (key: string) => {
  unchangableChangedChannel.postMessage(key);
};

const setItem = localStorage.setItem.bind(localStorage);
const removeItem = localStorage.removeItem.bind(localStorage);
const clearStorage = localStorage.clear.bind(localStorage);

localStorage.setItem = (key, value) => {
  if (unchangables[key] !== undefined) return;
  setItem.call(localStorage, key, value);
};
localStorage.removeItem = key => {
  if (unchangables[key] !== undefined) return;
  removeItem.call(localStorage, key);
};

localStorage.clear = () => {
  clearStorage();
  checkRemovedUnchangables();
};

let prevLen = localStorage.length;
const checkRemovedUnchangables = () => {
  if (prevLen === localStorage.length) return;
  prevLen = localStorage.length;

  Object.keys(unchangables).forEach(key => {
    if (key in localStorage) return;
    postChanged(key);
    unchangables[key]!();
  });
};

const startUnchangableChangesDetection = (() => {
  let isWasStarted = false;
  return () => {
    if (isWasStarted) return;
    isWasStarted = true;
    let checkInterval: ReturnType<typeof setInterval>;

    const listen = () => {
      clearInterval(checkInterval);
      checkInterval = setInterval(checkRemovedUnchangables, 0);
      checkRemovedUnchangables();
    };

    listen();

    window.addEventListener('focus', () => clearInterval(checkInterval), true);
    window.addEventListener('focus', () => clearInterval(checkInterval), false);
    window.addEventListener('click', () => clearInterval(checkInterval), false);
    window.addEventListener('click', () => clearInterval(checkInterval), true);
    window.addEventListener('blur', listen, true);
  };
})();

(() => {
  const forEach = (key: string) => {
    if (key in localStorage) return;
    unchangables[key]?.();
  };
  const then = () => Object.keys(methods).forEach(forEach);
  Object.defineProperty(window, 'localStorage', {
    get: () => {
      Promise.resolve().then(then);
      return localStorage;
    },
  });
})();

const itIt = <It>(it: It) => it;
