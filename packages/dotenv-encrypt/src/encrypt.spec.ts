const mockEncryptFunc = jest.fn();
const mockDecryptFunc = jest.fn();

// eslint-disable-next-line import/first
import { encryptValues, decryptValues } from "./encrypt";

describe("Encryption via KMS", () => {
  beforeEach(() => {
    mockEncryptFunc.mockResolvedValue("encrypted-content");
    mockDecryptFunc.mockResolvedValue("decrypted-content");
  });

  afterEach(() => {
    mockEncryptFunc.mockReset();
    mockDecryptFunc.mockReset();
  });

  it("can encrypt", async () => {
    const valuesToEncrypt = {
      "123": "test",
      EMPTY_STRING: "",
      MULTILINE_STRING: "multi\nline",
      VALUE1: "single line",
    };
    const encrypted = await encryptValues(valuesToEncrypt, mockEncryptFunc);
    expect(mockEncryptFunc).toHaveBeenCalledTimes(4);
    expect(mockDecryptFunc).not.toHaveBeenCalled();
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
    const decrypted = await decryptValues(valuesToDecrypt, mockDecryptFunc);
    expect(mockEncryptFunc).not.toHaveBeenCalled();
    expect(mockDecryptFunc).toHaveBeenCalledTimes(4);
    expect(Object.keys(decrypted)).toEqual(Object.keys(valuesToDecrypt));
    expect(decrypted.VALUE1).toEqual("decrypted-content");
  });
});
