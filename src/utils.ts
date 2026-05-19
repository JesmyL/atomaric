export const wait = (timeout = 1) => new Promise(res => setTimeout(res, timeout));

export const makeFullKey = <StorageKey extends string>(storageKey: StorageKey) => `atom\\${storageKey}`;
export const makeFullSecureKey = <StorageKey extends string>(storageKey: StorageKey) => `atom\`s\\${storageKey}`;
