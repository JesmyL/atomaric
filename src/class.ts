import {
  AtomOptions,
  AtomSetDeferredMethod,
  AtomSetMethod,
  AtomStoreKey,
  AtomSubscribeMethod,
  Atom as AtomType,
  DefaultActions,
} from '../types';
import { makeDoFillerActions } from './makeDoFillerActions';

type Subscriber<Value> = (value: Value) => void;

type Tools = { exp?: number };

export class Atom<Value, Actions extends Record<string, Function> = {}> implements AtomType<Value, Actions> {
  get;
  set: AtomSetMethod<Value>;
  setDeferred: AtomSetDeferredMethod<Value>;
  reset: () => void;
  subscribe: AtomSubscribeMethod<Value>;
  initialValue;
  isInitialValue;
  do!: Actions & DefaultActions<Value>;

  constructor(initialValue: Value, storeKeyOrOptions: AtomStoreKey | AtomOptions<Value, Actions> | undefined) {
    const updateCurrentValue = (value: Value) => (______current_value_____ = value);
    const getCurrentValue = () => (updatedValue === defaultUpdatedValue ? ______current_value_____ : updatedValue);
    const subscribers = new Set<Subscriber<Value>>();
    const invokeSubscriber = (sub: Subscriber<Value>) => sub(get());

    const defaultUpdatedValue = { 'oups... sorry': 'write us for fix this' } as Value;
    let updatedValue = defaultUpdatedValue;
    let updatePromise: Promise<unknown> | null = null;
    let lastIsPreventSave = false as boolean | nil;

    let ______current_value_____ = initialValue;
    let debounceTimeout: ReturnType<typeof setTimeout> | number | undefined;
    let save: (val: Value) => void = () => {};
    let get = () => getCurrentValue();
    let tools: Tools | null | undefined = null;

    let doFiller = () => {
      const doActions = makeDoFillerActions<Value, Actions>(initialValue, proxiedSelf, storeKeyOrOptions);
      doFiller = () => doActions;
      return doActions;
    };

    const proxiedSelf = new Proxy(this, {
      get: (self, prop) => (prop === 'do' ? doFiller() : self[prop as 'do']),
      set: retFalse,
    });

    const promiseResolver = () => {
      const value = updatedValue;
      const isPreventSave = lastIsPreventSave;

      updatePromise = null;
      lastIsPreventSave = false;
      updatedValue = defaultUpdatedValue;

      if (value === get() || value === undefined || (typeof value === 'number' && isNaN(value))) {
        return;
      }

      updateCurrentValue(value);
      subscribers.forEach(invokeSubscriber, this);

      try {
        updateHere.postMessage({ key, value: getCurrentValue() });
      } catch (e) {}

      if (isPreventSave !== true) save(value);
    };

    const set: typeof this.set = (value, isPreventSave) => {
      updatedValue = typeof value === 'function' ? (value as (value: Value) => Value)(get()) : value;

      lastIsPreventSave = isPreventSave;

      updatePromise ??= Promise.resolve().then(promiseResolver);
    };

    this.set = (value, isPreventSave) => set(value, isPreventSave);
    this.get = () => get();
    this.initialValue = initialValue;
    this.isInitialValue = () => initialValue === getCurrentValue();

    this.subscribe = sub => {
      subscribers.add(sub);
      return () => {
        subscribers.delete(sub);
      };
    };

    this.reset = () => {
      set(initialValue, true);
      subscribers.forEach(invokeSubscriber, this);
    };

    const deferredTimeOut = (value: Value, isPreventSave: boolean) => {
      set(value, isPreventSave);
      debounceTimeout = undefined;
    };

    this.setDeferred = (value, debounceMs = 500, isPreventSave, isInitInvoke = true) => {
      if (isInitInvoke && debounceTimeout === undefined) set(value, isPreventSave);
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(deferredTimeOut, debounceMs, value, isPreventSave);
    };

    if (storeKeyOrOptions == null) return proxiedSelf;

    ////////////////////////
    //////////////////////// storaged value
    ////////////////////////

    let storeKey = null;
    let exp = null;
    let warnOnDuplicateStoreKey = true;
    let listenStorageChanges = true;
    let isUnchangable = false;
    let expTimeout = -1 as never as ReturnType<typeof setTimeout>;

    let unzipValue: AtomOptions<Value, Actions>['unzipValue'] =
      initialValue instanceof Set ? strValue => new Set(strValue) : val => val;

    let zipValue: AtomOptions<Value, Actions>['zipValue'] =
      initialValue instanceof Set
        ? val => {
            if (val instanceof Set) return Array.from(val);

            console.error(val);
            throw 'The value is not Set instance';
          }
        : val => val;

    if (typeof storeKeyOrOptions === 'string') {
      storeKey = storeKeyOrOptions;
    } else if ('storeKey' in storeKeyOrOptions) {
      warnOnDuplicateStoreKey = storeKeyOrOptions.warnOnDuplicateStoreKey ?? warnOnDuplicateStoreKey;
      listenStorageChanges = storeKeyOrOptions.listenStorageChanges ?? listenStorageChanges;
      storeKey = storeKeyOrOptions.storeKey;

      unzipValue = storeKeyOrOptions.unzipValue ?? unzipValue;
      zipValue = storeKeyOrOptions.zipValue ?? zipValue;
      isUnchangable = storeKeyOrOptions.unchangable ?? isUnchangable;
      exp = storeKeyOrOptions.exp ?? exp;
    } else return proxiedSelf;

    const key = `${prefix}${storeKey}`;
    const stringifyValue =
      exp === null || !(exp(proxiedSelf, key in localStorage) instanceof Date)
        ? (value: Value) => JSON.stringify([zipValue(value)])
        : (value: Value) => {
            tools ??= {};
            tools.exp = exp(proxiedSelf, key in localStorage).getTime() + 0.2866;

            if (tools.exp - Date.now() < 24 * 60 * 60 * 1000) {
              clearTimeout(expTimeout);
              clearTimeout(initResetTimeouts[key]);
              expTimeout = setTimeout(() => this.reset(), tools.exp - Date.now());
            }

            return JSON.stringify([zipValue(value), tools]);
          };

    const parseValue = (value: string): Value => {
      const val = JSON.parse(value);
      tools = val[1];

      return unzipValue(val[0]);
    };

    let isInactualValue = true;
    registeredAtoms[key] = proxiedSelf;

    if (localStorage[`atom/${storeKey}`]) {
      localStorage[key] ||= `[${localStorage[`atom/${storeKey}`]}]`;
      delete localStorage[`atom/${storeKey}`];
    }

    get = () => {
      get = getCurrentValue;

      if (isInactualValue) {
        isInactualValue = false;
        try {
          updateCurrentValue(key in localStorage ? parseValue(localStorage[key]) : initialValue);
        } catch (e) {
          console.warn('Invalid json value', localStorage[key]);
        }
      }

      return getCurrentValue();
    };

    save = value => {
      if (value === initialValue) {
        this.reset();
        return;
      }
      localStorage[key] = stringifyValue(value);
    };

    this.reset = () => {
      delete localStorage[key];
      set(initialValue, true);
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

    return proxiedSelf;
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
const retFalse = (_self: any, prop: string) => {
  throw `${prop} is readonly property`;
};

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
const expMatcherReg = /"exp":(\d+)\.2866/;
const prefix = `atom\\`;
const registeredAtoms: Record<string, Atom<any>> = {};
const initResetTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

setTimeout(() => {
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(prefix) || typeof localStorage[key] !== 'string') return;
    const ts = +localStorage[key].match(expMatcherReg)?.[1]!;

    if (ts && ts - Date.now() < 24 * 60 * 60 * 1000) {
      initResetTimeouts[key] = setTimeout(() => {
        if (registeredAtoms[key]) registeredAtoms[key].reset();
        else delete localStorage[key];
      }, ts - Date.now());
    }
  });
}, 1000);
