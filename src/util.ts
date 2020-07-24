import { reduce } from "bluebird";
import { StringKeyedObject, KeyValuePair, ReducerFunction } from "./types";

export async function mapStringKeyedObject(
  obj: StringKeyedObject,
  reducerFunction: ReducerFunction
): Promise<StringKeyedObject> {
  const keys = Object.keys(obj).sort();
  const mappedObject = await reduce(keys, reducerFunction, {});
  return mappedObject;
}

export function getObjectDifferences(
  original: StringKeyedObject,
  newObject: StringKeyedObject
): string[] {
  const keys = Object.keys(newObject);
  const differences = keys.reduce((differentKeys: string[], key) => {
    if (newObject[key] !== original[key]) {
      differentKeys.push(key);
    }
    return differentKeys;
  }, []);
  return differences;
}

type KeyValuePair = string[]
export const outputEnvValue = ([key, value]: KeyValuePair): string =>
  `${key}="${value}"`;
