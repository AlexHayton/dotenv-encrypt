/* eslint-disable no-param-reassign */
import * as AWS from "aws-sdk";
import { StringKeyedObject } from "../../dotenv-encrypt/src/types";
import { mapStringKeyedObject } from "../../dotenv-encrypt/src/util";

export async function decryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string
): Promise<StringKeyedObject> {
  const kms = new AWS.KMS();
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

      obj[key] = (data.Plaintext && data.Plaintext.toString()) || "";
      return obj;
    }
  );
}

export async function encryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string
): Promise<StringKeyedObject> {
  const kms = new AWS.KMS();
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

      obj[key] = (data.CiphertextBlob && data.CiphertextBlob.toString("base64")) || "";
      return obj;
    }
  );
}
