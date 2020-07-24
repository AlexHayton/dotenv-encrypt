/* eslint-disable no-param-reassign */
import AWS from "aws-sdk";
import { StringKeyedObject } from "./types";
import { mapStringKeyedObject } from "./util";

const kms = new AWS.KMS();

export async function decryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string
): Promise<StringKeyedObject> {
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const value = encryptedValues[key];

      const data = await kms
        .decrypt({
          CiphertextBlob: Buffer.from(value, "base64"),
          EncryptionContext: { kmsKeyId },
        })
        .promise();

      obj[key] = data.Plaintext.toString();
      return obj;
    }
  );
}

export async function encryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string
): Promise<StringKeyedObject> {
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const value = encryptedValues[key];

      const data = await kms
        .encrypt({
          KeyId: kmsKeyId,
          Plaintext: value,
          EncryptionContext: { key },
        })
        .promise();

      obj[key] = data.CiphertextBlob.toString("base64");
      return obj;
    }
  );
}
