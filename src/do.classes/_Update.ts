import { makeDeepProxyObject } from '../makeDeepProxyObject';
import { AtomDoActionsBasic } from './_Basic';

export class AtomUpdateDoAction extends AtomDoActionsBasic {
  protected updateValue = <Object extends object | unknown[]>(
    object: Object,
    updater: (object: Object) => void,
  ): Object => {
    const newObject = Array.isArray(object) ? object.slice(0) : { ...object };
    let isSomeSetted = false;

    const pro = makeDeepProxyObject(object, {
      onSet: (_, keys, setKey, value, prevValue) => {
        if (value === prevValue) return true;
        let currentObject = newObject as Record<string, unknown> | unknown[];

        isSomeSetted = true;

        for (const key of keys) {
          const nextObject = currentObject[key as never] as object;

          currentObject = currentObject[key as never] = (
            Array.isArray(nextObject) ? nextObject.slice(0) : { ...nextObject }
          ) as never;
        }

        currentObject[setKey as never] = value as never;

        return true;
      },
    });

    updater(pro);

    return isSomeSetted ? (newObject as never) : object;
  };
}
