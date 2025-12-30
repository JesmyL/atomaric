import {
  AtomOptions,
  AtomSetDeferredMethod,
  AtomSetMethod,
  AtomStoreKey,
  AtomSubscribeMethod,
  Atom as AtomType,
  DefaultActions,
} from '../types';
import { configuredOptions } from './lib';
import { makeDoFillerActions } from './makeDoFillerActions';

type Subscriber<Value> = (value: Value) => void;

type Tools = { exp?: number };

export const enum AtomSecureLevel {
  None,
  Simple,
  Middle,
  Strong,
}

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
    const getCurrentValue = () => ______current_value_____;
    const subscribers = new Set<Subscriber<Value>>();
    const invokeSubscriber = (sub: Subscriber<Value>) => sub(get());

    let isQueueWait = true;
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
      isQueueWait = true;
      if (lastIsPreventSave !== true) save(get());
      lastIsPreventSave = false;

      try {
        updateHere.postMessage({ key, value: getCurrentValue() });
      } catch (e) {}
    };

    const set: typeof this.set = (value, isPreventSave) => {
      const nextValue = typeof value === 'function' ? (value as (value: Value) => Value)(get()) : value;

      if (nextValue === get()) return;

      updateCurrentValue(nextValue);
      lastIsPreventSave = isPreventSave;

      if (isQueueWait) {
        isQueueWait = false;
        subscribers.forEach(invokeSubscriber);

        queueMicrotask(promiseResolver);
      }
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
    let securifyKeyLevel = AtomSecureLevel.None;
    let securifyValueLevel = AtomSecureLevel.None;
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
      securifyKeyLevel = storeKeyOrOptions.securifyKeyLevel ?? configuredOptions.securifyKeyLevel ?? securifyKeyLevel;
      securifyValueLevel =
        storeKeyOrOptions.securifyValueLevel ?? configuredOptions.securifyValueLevel ?? securifyValueLevel;
      exp = storeKeyOrOptions.exp ?? exp;
    } else return proxiedSelf;

    const keyPostfix = securifyKeyLevel ? stringifySecure(storeKey, AtomSecureLevel.Strong) : storeKey;
    const key = `${securifyValueLevel ? sequrePrefix : prefix}${keyPostfix}`;

    if (securifyKeyLevel) {
      const unsequreKey = `${prefix}${storeKey}`;
      if (unsequreKey in localStorage_) {
        localStorage_[key] = localStorage_[unsequreKey];
        delete localStorage_[unsequreKey];
      }
    } else {
      const sequreKey = `${prefix}${stringifySecure(storeKey, AtomSecureLevel.Strong)}`;
      if (sequreKey in localStorage_) {
        localStorage_[key] = localStorage_[sequreKey];
        delete localStorage_[sequreKey];
      }
    }

    if (securifyValueLevel) {
      delete localStorage_[`${prefix}${keyPostfix}`];

      const zip = zipValue;
      const unzip = unzipValue;

      unzipValue = value => {
        try {
          return unzip(parseSecure(value, securifyValueLevel)[0]);
        } catch (e) {
          delete localStorage_[key];
          return '' as Value;
        }
      };
      zipValue = value => {
        try {
          return stringifySecure([zip(value)], securifyValueLevel);
        } catch (e) {
          delete localStorage_[key];
          return '';
        }
      };
    } else delete localStorage_[`${sequrePrefix}${keyPostfix}`];

    const stringifyValue =
      exp === null || !(exp(proxiedSelf, key in localStorage_) instanceof Date)
        ? (value: Value) => stringifySecure([zipValue(value)], AtomSecureLevel.None)
        : (value: Value) => {
            tools ??= {};
            tools.exp = exp(proxiedSelf, key in localStorage_).getTime();

            if (tools.exp - Date.now() < 24 * 60 * 60 * 1000) {
              clearTimeout(expTimeout);
              clearTimeout(initResetTimeouts[key]);
              expTimeout = setTimeout(() => this.reset(), tools.exp - Date.now());
            }

            tools.exp = Math.trunc(tools.exp / 1000);

            return stringifySecure([zipValue(value), tools], AtomSecureLevel.None);
          };

    const parseValue = (value: string): Value => {
      const val = parseSecure(value, AtomSecureLevel.None);
      tools = val[1];

      return unzipValue(val[0]);
    };

    let isInactualValue = true;
    registeredAtoms[key] = proxiedSelf;

    if (localStorage_[`atom/${storeKey}`]) {
      localStorage_[key] ||= `[${localStorage_[`atom/${storeKey}`]}]`;
      delete localStorage_[`atom/${storeKey}`];
    }

    get = () => {
      get = getCurrentValue;

      if (isInactualValue) {
        isInactualValue = false;
        try {
          updateCurrentValue(key in localStorage_ ? parseValue(localStorage_[key]) : initialValue);
        } catch (e) {
          console.warn('Invalid json value', localStorage_[key]);
        }
      }

      return getCurrentValue();
    };

    save = value => {
      if (value === initialValue) {
        this.reset();
        return;
      }
      localStorage_[key] = stringifyValue(value);
    };

    this.reset = () => {
      delete localStorage_[key];
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

          localStorage_[key] = stringifyValue(getCurrentValue());
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

const localStorage_ = localStorage;
const update: Partial<Record<string, (event: StorageEvent) => void>> = {};
const unchangableAtoms: Partial<Record<string, Atom<unknown>>> = {};
const retFalse = (_self: any, prop: string) => {
  throw `${prop} is readonly property`;
};

window.addEventListener('storage', event => {
  if (event.key === null || event.newValue === event.oldValue) return;
  update[event.key]?.(event);
});

const setItem = localStorage_.setItem.bind(localStorage_);
const removeItem = localStorage_.removeItem.bind(localStorage_);

localStorage_.setItem = (key, value) => {
  if (unchangableAtoms[key] !== undefined) return;
  setItem.call(localStorage_, key, value);
};
localStorage_.removeItem = key => {
  if (unchangableAtoms[key] !== undefined) return;
  removeItem.call(localStorage_, key);
};
const expMatcherReg = /"exp":\s*(\d+)/;
const prefix = `atom\\`;
const sequrePrefix = 'atom`s\\';
const registeredAtoms: Record<string, Atom<any>> = {};
const initResetTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
const findLettersReg = /[a-z]/gi;
const unsecureLength = 5;
const lettersCaseSwitcedDict: Record<string, string> = {};

for (let i = 54; i < 80; i++) {
  if (i === 68 || i === 72 || i === 55) continue;

  const upper = String.fromCharCode(i + 43).toUpperCase();
  const lower = String.fromCharCode(i + 43).toLowerCase();

  lettersCaseSwitcedDict[upper] = lower;
  lettersCaseSwitcedDict[lower] = upper;
}

const switchLetterCase = (letter: string) => lettersCaseSwitcedDict[letter] ?? letter;

const stringifySecure = (() => {
  const stringifyDict: Record<AtomSecureLevel, (value: any) => string> = {
    [AtomSecureLevel.None]: value => JSON.stringify(value),
    [AtomSecureLevel.Simple]: value => btoa(encodeURI(stringifyDict[AtomSecureLevel.None](value))),
    [AtomSecureLevel.Middle]: value => {
      const newValue = stringifyDict[AtomSecureLevel.Simple](value);

      return `${newValue.slice(0, unsecureLength)}${newValue
        .slice(unsecureLength)
        .replace(findLettersReg, switchLetterCase)}`;
    },
    [AtomSecureLevel.Strong]: value => btoa(stringifyDict[AtomSecureLevel.Middle](value)),
  };

  return (value: any, level: AtomSecureLevel) => {
    try {
      return stringifyDict[level](value);
    } catch (e) {
      if (level === AtomSecureLevel.None) throw e;
      return stringifyDict[AtomSecureLevel.None](value);
    }
  };
})();

const parseSecure = (() => {
  const parseDict: Record<AtomSecureLevel, (value: string) => any> = {
    [AtomSecureLevel.None]: value => JSON.parse(value),
    [AtomSecureLevel.Simple]: value => parseDict[AtomSecureLevel.None](decodeURI(atob(value))),
    [AtomSecureLevel.Middle]: value =>
      parseDict[AtomSecureLevel.Simple](
        `${value.slice(0, unsecureLength)}${value.slice(unsecureLength).replace(findLettersReg, switchLetterCase)}`,
      ),
    [AtomSecureLevel.Strong]: value => parseDict[AtomSecureLevel.Middle](atob(value)),
  };

  return (value: string, level: AtomSecureLevel) => {
    try {
      return parseDict[level](value);
    } catch (e) {
      if (level === AtomSecureLevel.None) throw e;
      return parseDict[AtomSecureLevel.None](value);
    }
  };
})();

setTimeout(() => {
  Object.keys(localStorage_).forEach(key => {
    if (typeof localStorage_[key] !== 'string' || (!key.startsWith(prefix) && !key.startsWith(sequrePrefix))) return;
    const secTs = +localStorage_[key].match(expMatcherReg)?.[1]!;

    if (!secTs || secTs * 1000 - Date.now() > 24 * 60 * 60 * 1000) return;

    const jsonValue = parseSecure(localStorage_[key], AtomSecureLevel.None);

    if (!Array.isArray(jsonValue) || jsonValue[1] == null || !('exp' in jsonValue[1]) || jsonValue[1].exp !== secTs)
      return;

    initResetTimeouts[key] = setTimeout(() => {
      if (registeredAtoms[key]) registeredAtoms[key].reset();
      else delete localStorage_[key];
    }, secTs * 1000 - Date.now());
  });
}, 1000);
