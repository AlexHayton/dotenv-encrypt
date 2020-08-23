/* eslint-disable no-param-reassign */
import * as AWS from "aws-sdk";
import { StringKeyedObject } from "./types";
import { mapStringKeyedObject } from "./util";

export async function decryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string,
  region: string
): Promise<StringKeyedObject> {
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const encryptedValue = encryptedValues[key];
      const decryptedValue = await decryptValue({ encryptedValue, key, kmsKeyId, region });
      obj[key] = decryptedValue;
      return obj;
    }
  );
}

interface DecryptValueArgs {
  encryptedValue: string;
  key: string;
  kmsKeyId: string;
  region: string;
}
export async function decryptValue({
  encryptedValue,
  key,
  kmsKeyId,
  region,
}: DecryptValueArgs): Promise<string> {
  const kms = new AWS.KMS({ region });
  const data = await kms
    .decrypt({
      CiphertextBlob: Buffer.from(encryptedValue, "base64"),
      KeyId: kmsKeyId,
      EncryptionContext: { key }
    })
    .promise();

  return (data.Plaintext && data.Plaintext.toString()) || "";
}

export async function encryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string,
  region: string
): Promise<StringKeyedObject> {
  const kms = new AWS.KMS({ region });
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const value = encryptedValues[key];
      const encryptedValue = await encryptValue({ plaintextValue: value, key, kmsKeyId, region });
      obj[key] = encryptedValue;
      return obj;
    }
  );
}

interface EncryptValueArgs {
  plaintextValue: string;
  key: string;
  kmsKeyId: string;
  region: string;
}
export async function encryptValue({
  plaintextValue,
  key,
  kmsKeyId,
  region,
}: EncryptValueArgs) {
  const kms = new AWS.KMS({ region });
  const data = await kms
    .encrypt({
      KeyId: kmsKeyId,
      Plaintext: plaintextValue,
      EncryptionContext: { key }
    })
    .promise();

  return (data.CiphertextBlob && data.CiphertextBlob.toString("base64")) || "";
}
