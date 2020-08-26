/* eslint-disable no-param-reassign */
import { StringKeyedObject, EncryptFunction, DecryptFunction } from "./types";
import { mapStringKeyedObject } from "./util";

export async function decryptValues(
  encryptedValues: StringKeyedObject,
  decryptFunc: DecryptFunction,
): Promise<StringKeyedObject> {
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const encryptedValue = encryptedValues[key];
      obj[key] = decryptFunc(encryptedValue);
      return obj;
    }
  );
}

export async function encryptValues(
  decryptedValues: StringKeyedObject,
  encryptFunc: EncryptFunction,
): Promise<StringKeyedObject> {
  return mapStringKeyedObject(
    decryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const value = decryptedValues[key];
      obj[key] = await encryptFunc(value);
      return obj;
    }
  );
}
