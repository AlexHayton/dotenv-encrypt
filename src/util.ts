import difference from "lodash/difference";
import { reduce } from "bluebird";
import { StringKeyedObject, ReducerFunction } from "./types";

export async function mapStringKeyedObject(
  obj: StringKeyedObject,
  reducerFunction: ReducerFunction
): Promise<StringKeyedObject> {
  const keys = Object.keys(obj).sort();
  const mappedObject = await reduce(keys, reducerFunction, {});
  return mappedObject;
}

export interface ObjectDifferences {
  changedKeys: string[],
  removedKeys: string[],
}
export function getObjectDifferences(
  original: StringKeyedObject,
  newObject: StringKeyedObject
): ObjectDifferences {
  const keys = Object.keys(newObject);
  const changedKeys = keys.reduce((differentKeys: string[], key) => {
    if (newObject[key] !== original[key]) {
      differentKeys.push(key);
    }
    return differentKeys;
  }, []);

  const removedKeys = difference(Object.keys(original), keys);

  return {
    changedKeys,
    removedKeys,
  }
}

export const outputEnvValue = ([key, value]: string[]): string =>
  `${key}="${value}"`;
