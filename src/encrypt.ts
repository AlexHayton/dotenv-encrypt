/* eslint-disable no-param-reassign */
import { encrypt, decrypt } from "@aws-crypto/encrypt-node";
import { KmsKeyringNode } from "@aws-crypto/kms-keyring-node";
import { StringKeyedObject } from "./types";
import { mapStringKeyedObject } from "./util";

const keyring = new KmsKeyringNode

export async function decryptValues(
  encryptedValues: StringKeyedObject,
  kmsKeyId: string,
  region: string,
): Promise<StringKeyedObject> {
  const keyring = new KmsKeyringNode({ generatorKeyId: kmsKeyId, region });
  const kms = new AWS.KMS({ region });
  return mapStringKeyedObject(
    encryptedValues,
    async (obj: StringKeyedObject, key: string) => {
      const value = encryptedValues[key];
      const decodedValue = Buffer.from(value, "base64").toString();

      const data = await kms
        .decrypt({
          CiphertextBlob: decodedValue,
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
  kmsKeyId: string,
  region: string,
): Promise<StringKeyedObject> {
  const kms = new AWS.KMS({ region });
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
