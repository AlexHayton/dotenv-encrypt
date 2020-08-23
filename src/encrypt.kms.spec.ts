import { encryptValue, decryptValue } from "./encrypt";

describe.skip("Encrypt with a real KMS", () => {
  it("Can encrypt a value then decrypt it", async () => {
    const plaintextValue = "value";
    const key = "key";
    const kmsKeyId = "<Your KMS Key Here>";
    const region = "us-east-1";
    const encryptedValue = await encryptValue({ plaintextValue, key, kmsKeyId, region });
    const decryptedValue = await decryptValue({ encryptedValue, key, kmsKeyId, region });
    expect(decryptedValue).toEqual(plaintextValue);
  })
})
