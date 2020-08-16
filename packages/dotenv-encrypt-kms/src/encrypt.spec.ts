import { v4 as uuid } from "uuid";

const kmsKeyId = uuid();

const mockKMSEncrypt = jest.fn();
const mockKMSDecrypt = jest.fn();
const mockKMSEncryptPromise = jest.fn().mockReturnValue({
  promise: mockKMSEncrypt,
});
const mockKMSDecryptPromise = jest.fn().mockReturnValue({
  promise: mockKMSDecrypt,
});
jest.mock("aws-sdk", () => {
  return {
    KMS: jest.fn(() => ({
      encrypt: mockKMSEncryptPromise,
      decrypt: mockKMSDecryptPromise,
    })),
  };
});

// eslint-disable-next-line import/first
import { encryptValues, decryptValues } from "./encrypt";

describe("Encryption via KMS", () => {
  beforeEach(() => {
    mockKMSEncrypt.mockResolvedValue({
      CiphertextBlob: Buffer.from("encrypted-content"),
    });
    mockKMSDecrypt.mockResolvedValue({ Plaintext: "decrypted-content" });
  });

  afterEach(() => {
    mockKMSEncrypt.mockReset();
    mockKMSDecrypt.mockReset();
  });

  it("can encrypt", async () => {
    const valuesToEncrypt = {
      "123": "test",
      EMPTY_STRING: "",
      MULTILINE_STRING: "multi\nline",
      VALUE1: "single line",
    };
    const encrypted = await encryptValues(valuesToEncrypt, kmsKeyId);
    expect(mockKMSEncrypt).toHaveBeenCalledTimes(4);
    expect(mockKMSDecrypt).not.toHaveBeenCalled();
    expect(Object.keys(encrypted)).toEqual(Object.keys(valuesToEncrypt));
    expect(encrypted.VALUE1).toEqual("ZW5jcnlwdGVkLWNvbnRlbnQ=");
  });

  it("can decrypt", async () => {
    const valuesToDecrypt = {
      "123": "ENCRYPTED",
      EMPTY_STRING: "ENCRYPTED",
      MULTILINE_STRING: "ENCRYPTED",
      VALUE1: "ENCRYPTED",
    };
    const decrypted = await decryptValues(valuesToDecrypt, kmsKeyId);
    expect(mockKMSEncrypt).not.toHaveBeenCalled();
    expect(mockKMSDecrypt).toHaveBeenCalledTimes(4);
    expect(Object.keys(decrypted)).toEqual(Object.keys(valuesToDecrypt));
    expect(decrypted.VALUE1).toEqual("decrypted-content");
  });
});
