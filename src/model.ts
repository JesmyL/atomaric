export type Path<T, Sep extends string> = T extends any ? PathInternal<T, Sep> : never;
// export type PathValue<T, Sep extends string, ValuePath extends Path<T, Sep>> = TPathValue<T, Sep, ValuePath>;

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

type PathInternal<T, Sep extends string, TraversedTypes = T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: PathImpl<K & string, Sep, T[K], TraversedTypes>;
      }[TupleKeys<T>]
    : PathImpl<ArrayKey, Sep, V, TraversedTypes>
  : {
      [K in keyof T]-?: PathImpl<K & string, Sep, T[K], TraversedTypes>;
    }[keyof T];

export type TupleKeys<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;

type PathImpl<K extends string | number, Sep extends string, V, TraversedTypes> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : true extends AnyIsEqual<TraversedTypes, V>
  ? `${K}`
  : `${K}` | `${K}${Sep}${PathInternal<V, Sep, TraversedTypes | V>}`;

export type ArrayKey = number;
export type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export type IsTuple<T extends ReadonlyArray<any>> = number extends T['length'] ? false : true;
export type BrowserNativeObject = Date | FileList | File;

type AnyIsEqual<T1, T2> = T1 extends T2 ? (IsEqual<T1, T2> extends true ? true : never) : never;
export type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

export type PathValue<T, Sep extends string, P extends Path<T, Sep> | ArrayPath<T, Sep>> = T extends any
  ? P extends `${infer K}${Sep}${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K], Sep>
        ? PathValue<T[K], Sep, R>
        : never
      : K extends `${ArrayKey}`
      ? T extends ReadonlyArray<infer V>
        ? PathValue<V, Sep, R & Path<V, Sep>>
        : never
      : never
    : P extends keyof T
    ? T[P]
    : P extends `${ArrayKey}`
    ? T extends ReadonlyArray<infer V>
      ? V
      : never
    : never
  : never;

export type ArrayPath<T, Sep extends string> = T extends any ? ArrayPathInternal<T, Sep> : never;

type ArrayPathInternal<T, Sep extends string, TraversedTypes = T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathImpl<K & string, Sep, T[K], TraversedTypes>;
      }[TupleKeys<T>]
    : ArrayPathImpl<ArrayKey, Sep, V, TraversedTypes>
  : {
      [K in keyof T]-?: ArrayPathImpl<K & string, Sep, T[K], TraversedTypes>;
    }[keyof T];

type ArrayPathImpl<K extends string | number, Sep extends string, V, TraversedTypes> = V extends
  | Primitive
  | BrowserNativeObject
  ? IsAny<V> extends true
    ? string
    : never
  : V extends ReadonlyArray<infer U>
  ? U extends Primitive | BrowserNativeObject
    ? IsAny<V> extends true
      ? string
      : never
    : true extends AnyIsEqual<TraversedTypes, V>
    ? never
    : `${K}` | `${K}${Sep}${ArrayPathInternal<V, Sep, TraversedTypes | V>}`
  : true extends AnyIsEqual<TraversedTypes, V>
  ? never
  : `${K}${Sep}${ArrayPathInternal<V, Sep, TraversedTypes | V>}`;

export type IsAny<T> = 0 extends 1 & T ? true : false;
