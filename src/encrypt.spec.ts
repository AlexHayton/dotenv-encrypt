import { v4 as uuid } from "uuid";

const kmsKeyId = uuid();
const region = "us-east-1";

const mockKMSEncrypt = jest.fn().mockResolvedValue({
  CiphertextBlob: Buffer.from("encrypted-content"),
});
const mockKMSDecrypt = jest
  .fn()
  .mockResolvedValue({ Plaintext: "decrypted-content" });
const mockKMSEncryptPromise = jest.fn().mockReturnValue({
  promise: mockKMSEncrypt,
});
const mockKMSDecryptPromise = jest.fn().mockReturnValue({
  promise: mockKMSDecrypt,
});
const mockKMSInit = jest.fn().mockReturnValue({
  encrypt: mockKMSEncryptPromise,
  decrypt: mockKMSDecryptPromise,
});
jest.mock("aws-sdk", () => {
  return {
    KMS: mockKMSInit,
  };
});

// eslint-disable-next-line import/first
import { encryptValues, decryptValues } from "./encrypt";

describe("Encryption via KMS", () => {
  afterEach(() => {
    mockKMSInit.mockClear();
    mockKMSEncrypt.mockClear();
    mockKMSDecrypt.mockClear();
  });

  it("can encrypt", async () => {
    const valuesToEncrypt = {
      "123": "test",
      EMPTY_STRING: "",
      MULTILINE_STRING: "multi\nline",
      VALUE1: "single line",
    };
    const encrypted = await encryptValues(valuesToEncrypt, kmsKeyId, region);
    expect(mockKMSInit).toHaveBeenCalledWith({ region });
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
    const decrypted = await decryptValues(valuesToDecrypt, kmsKeyId, region);
    expect(mockKMSInit).toHaveBeenCalledWith({ region });
    expect(mockKMSEncrypt).not.toHaveBeenCalled();
    expect(mockKMSDecrypt).toHaveBeenCalledTimes(4);
    expect(Object.keys(decrypted)).toEqual(Object.keys(valuesToDecrypt));
    expect(decrypted.VALUE1).toEqual("decrypted-content");
  });
});
