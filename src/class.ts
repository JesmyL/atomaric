/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AtomOptions,
  AtomSecureLevel,
  AtomSetDeferredMethod,
  AtomSetMethod,
  AtomStorageKey,
  AtomSubscribeMethod,
  Atom as AtomType,
  DefaultActions,
} from '../types';
import { configuredOptions } from './lib';
import { makeDoFillerActions } from './makeDoFillerActions';

type Subscriber<Value> = (value: Value) => void;

type Tools = { exp?: number };

export class Atom<Value, Actions extends Record<string, AnyFunc> = Record<string, AnyFunc>> implements AtomType<
  Value,
  Actions
> {
  get;
  set: AtomSetMethod<Value>;
  setDeferred: AtomSetDeferredMethod<Value>;
  reset: () => void;
  subscribe: AtomSubscribeMethod<Value>;
  initialValue;
  isInitialValue;
  do!: Actions & DefaultActions<Value>;

  constructor(
    initialValue: Value | (() => Value),
    storageKeyOrOptions: AtomStorageKey | AtomOptions<Value, Actions> | undefined,
  ) {
    initialValue = typeof initialValue === 'function' ? (initialValue as () => Value)() : initialValue;

    const updateCurrentValue = (value: Value) => (______current_value_____ = value);
    const getCurrentValue = () => ______current_value_____;
    const subscribers = new Set<Subscriber<Value>>();
    const invokeSubscriber = (sub: Subscriber<Value>) => sub(get());

    let isQueueWait = true;
    let lastIsPreventSave = false as boolean | nil;
    let filterValue: Required<AtomOptions<Value, Actions>>['filter'] = () => true;

    let ______current_value_____ = initialValue;
    let debounceTimeout: ReturnType<typeof setTimeout> | number | undefined;
    let save: (val: Value) => void = () => {};
    let get = () => getCurrentValue();
    let tools: Tools | null | undefined = null;

    let doFiller = () => {
      const doActions = makeDoFillerActions<Value, Actions>(initialValue, proxiedSelf, storageKeyOrOptions);
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
      } catch (_e) {
        //
      }
    };

    const set: typeof this.set = (value, isPreventSave) => {
      const nextValue = typeof value === 'function' ? (value as (value: Value) => Value)(get()) : value;

      if (nextValue === get() || !filterValue(nextValue, get())) return;

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

    if (storageKeyOrOptions == null) return proxiedSelf;

    ////////////////////////
    //////////////////////// storaged value
    ////////////////////////

    let storageKey = null;
    let exp = null;
    let warnOnDuplicateStorageKey = true;
    let listenStorageChanges = true;
    let isUnchangable = false;
    let securifyKeyLevel: AtomSecureLevel = 0;
    let securifyValueLevel: AtomSecureLevel = 0;
    let expTimeout = -1 as never as ReturnType<typeof setTimeout>;

    let unzipValue: AtomOptions<Value, Actions>['unzipValue'] =
      initialValue instanceof Set
        ? strValue => new Set(strValue)
        : initialValue instanceof Map
          ? strValue => new Map(strValue)
          : val => val;

    let zipValue: AtomOptions<Value, Actions>['zipValue'] =
      initialValue instanceof Set
        ? val => {
            if (val instanceof Set) return Array.from(val);

            console.error(val);
            throw 'The value is not Set instance';
          }
        : initialValue instanceof Map
          ? val => {
              if (val instanceof Map) {
                const arr: [unknown, unknown][] = [];

                val.forEach((value, key) => arr.push([key, value]));

                return arr;
              }

              console.error(val);
              throw 'The value is not Set instance';
            }
          : val => val;

    if (typeof storageKeyOrOptions === 'string') {
      storageKey = storageKeyOrOptions;
    } else {
      filterValue = storageKeyOrOptions.filter ?? filterValue;

      if ('storageKey' in storageKeyOrOptions) {
        warnOnDuplicateStorageKey = storageKeyOrOptions.warnOnDuplicateStorageKey ?? warnOnDuplicateStorageKey;
        listenStorageChanges = storageKeyOrOptions.listenStorageChanges ?? listenStorageChanges;
        storageKey = storageKeyOrOptions.storageKey;

        unzipValue = storageKeyOrOptions.unzipValue ?? unzipValue;
        zipValue = storageKeyOrOptions.zipValue ?? zipValue;
        isUnchangable = storageKeyOrOptions.unchangable ?? isUnchangable;
        securifyKeyLevel =
          storageKeyOrOptions.securifyKeyLevel ?? configuredOptions.securifyKeyLevel ?? securifyKeyLevel;
        securifyValueLevel =
          storageKeyOrOptions.securifyValueLevel ?? configuredOptions.securifyValueLevel ?? securifyValueLevel;
        exp = storageKeyOrOptions.exp ?? exp;
      } else return proxiedSelf;
    }

    const keyPostfix = securifyKeyLevel ? stringifySecure(storageKey, securifyKeyLevel) : storageKey;
    const key = `${securifyValueLevel ? sequrePrefix : prefix}${keyPostfix}`;

    if (securifyKeyLevel) {
      const unsequreKey = `${prefix}${storageKey}`;
      if (unsequreKey in localStorage_) {
        localStorage_[key] = localStorage_[unsequreKey];
        delete localStorage_[unsequreKey];
      }
    } else {
      const sequreKey = `${prefix}${stringifySecure(storageKey, securifyKeyLevel)}`;
      if (sequreKey in localStorage_) {
        localStorage_[key] = localStorage_[sequreKey];
        delete localStorage_[sequreKey];
      }
    }

    const stringifyValue =
      exp === null || !(exp(proxiedSelf, key in localStorage_) instanceof Date)
        ? (value: Value) => stringifySecure([zipValue!(value)], 0)
        : (value: Value) => {
            tools ??= {};
            tools.exp = exp(proxiedSelf, key in localStorage_).getTime();

            if (tools.exp - Date.now() < 24 * 60 * 60 * 1000) {
              clearTimeout(expTimeout);
              clearTimeout(initResetTimeouts[key]);
              expTimeout = setTimeout(() => this.reset(), tools.exp - Date.now());
            }

            tools.exp = Math.trunc(tools.exp / 1000);

            return stringifySecure([zipValue!(value), tools], 0);
          };

    if (securifyValueLevel) {
      const unsecureKey = `${prefix}${keyPostfix}`;
      const zip = zipValue;
      const unzip = unzipValue;

      zipValue = value => {
        try {
          return stringifySecure([zip(value)], securifyValueLevel);
        } catch (_e) {
          delete localStorage_[key];
          return '';
        }
      };

      if (unsecureKey in localStorage_) {
        const secureKey = `${prefix}${stringifySecure(storageKey, securifyKeyLevel)}`;

        try {
          localStorage_[secureKey] = stringifyValue(unzipValue(parseSecure(localStorage_[unsecureKey], 0)[0]));
          delete localStorage_[unsecureKey];
        } catch (_e) {
          //
        }
      }

      unzipValue = value => {
        try {
          return unzip(parseSecure(value, securifyValueLevel)[0]);
        } catch (_e) {
          delete localStorage_[key];
          return '' as Value;
        }
      };
    } else delete localStorage_[`${sequrePrefix}${keyPostfix}`];

    const parseValue = (value: string): Value => {
      const val = parseSecure(value, 0);
      tools = val[1];

      return unzipValue(val[0]);
    };

    let isInactualValue = true;
    registeredAtoms[key] = proxiedSelf;

    if (localStorage_[`atom/${storageKey}`]) {
      localStorage_[key] ||= `[${localStorage_[`atom/${storageKey}`]}]`;
      delete localStorage_[`atom/${storageKey}`];
    }

    get = () => {
      get = getCurrentValue;

      if (isInactualValue) {
        isInactualValue = false;
        try {
          updateCurrentValue(key in localStorage_ ? parseValue(localStorage_[key]) : initialValue);
        } catch (_e) {
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

    if (warnOnDuplicateStorageKey && update[key] !== undefined) console.warn('Duplicate Atom key', storageKey);

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
} catch (_e) {
  //
}

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
  const stringifyDict: Record<AtomSecureLevel, (value: any) => string> = [
    value => JSON.stringify(value),
    value => btoa(encodeURI(stringifyDict[0](value))),
    value => {
      const newValue = stringifyDict[1](value);

      return `${newValue.slice(0, unsecureLength)}${newValue
        .slice(unsecureLength)
        .replace(findLettersReg, switchLetterCase)}`;
    },
    value => btoa(stringifyDict[2](value)),
  ];

  return (value: any, level: AtomSecureLevel) => {
    try {
      return stringifyDict[level](value);
    } catch (e) {
      if (level === 0) throw e;
      return stringifyDict[0](value);
    }
  };
})();

const parseSecure = (() => {
  const parseDict: Record<AtomSecureLevel, (value: string) => any> = [
    value => JSON.parse(value),
    value => parseDict[0](decodeURI(atob(value))),
    value =>
      parseDict[1](
        `${value.slice(0, unsecureLength)}${value.slice(unsecureLength).replace(findLettersReg, switchLetterCase)}`,
      ),
    value => parseDict[2](atob(value)),
  ];

  return (value: string, level: AtomSecureLevel) => {
    try {
      return parseDict[level](value);
    } catch (e) {
      if (level === 0) throw e;
      return parseDict[0](value);
    }
  };
})();

setTimeout(() => {
  Object.keys(localStorage_).forEach(key => {
    if (typeof localStorage_[key] !== 'string' || (!key.startsWith(prefix) && !key.startsWith(sequrePrefix))) return;
    const secTsStr = localStorage_[key].match(expMatcherReg)?.[1];

    if (!secTsStr || +secTsStr * 1000 - Date.now() > 24 * 60 * 60 * 1000) return;

    const jsonValue = parseSecure(localStorage_[key], 0);

    if (!Array.isArray(jsonValue) || jsonValue[1] == null || !('exp' in jsonValue[1]) || jsonValue[1].exp !== secTsStr)
      return;

    initResetTimeouts[key] = setTimeout(
      () => {
        if (registeredAtoms[key]) registeredAtoms[key].reset();
        else delete localStorage_[key];
      },
      +secTsStr * 1000 - Date.now(),
    );
  });
}, 1000);
