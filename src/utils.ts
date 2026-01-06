export const wait = (timeout = 1) => new Promise(res => setTimeout(res, timeout));

export const makeFullKey = <StoreKey extends string>(storeKey: StoreKey) => `atom\\${storeKey}`;
export const makeFullSecureKey = <StoreKey extends string>(storeKey: StoreKey) => `atom\`s\\${storeKey}`;
