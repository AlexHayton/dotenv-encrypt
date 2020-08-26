/* eslint-disable no-param-reassign */
import * as AWS from "aws-sdk";
import { StringKeyedObject } from "../../dotenv-encrypt/src/types";
import { mapStringKeyedObject } from "../../dotenv-encrypt/src/util";

export async function decryptValues(
  valueToDecrypt: string,
  kmsKeyId: string
): Promise<string> {
  const kms = new AWS.KMS();

  const data = await kms
    .decrypt({
      CiphertextBlob: Buffer.from(valueToDecrypt, "base64"),
      EncryptionContext: { kmsKeyId },
    })
    .promise();

  const decryptedValue = (data.Plaintext && data.Plaintext.toString()) || "";
  return decryptedValue;
}

export async function encryptValues(
  valueToEncrypt: string,
  kmsKeyId: string
): Promise<string> {
  const kms = new AWS.KMS();
  const data = await kms
    .encrypt({
      KeyId: kmsKeyId,
      Plaintext: valueToEncrypt,
      EncryptionContext: { key: kmsKeyId },
    })
    .promise();

  const encryptedValue =
    (data.CiphertextBlob && data.CiphertextBlob.toString("base64")) || "";
  return encryptedValue;
}
