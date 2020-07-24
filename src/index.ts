import fs from "fs";
import { promisify } from "util";
import yargs from "yargs";
import { EOL } from "os";
import toPairs from "lodash/toPairs";
import { decryptValues, encryptValues } from "./encrypt";
import { parse } from "./parse";
import { getObjectDifferences, outputEnvValue } from "./util";

const decryptedEnvFilePath = ".env";
const encryptedEnvFilePath = ".env.encrypted";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function encryptAndWrite(kmsKeyId: string): Promise<void> {
  const newFile = await readFile(decryptedEnvFilePath);
  const newValues = parse(newFile);
  const oldEncryptedFile = await readFile(encryptedEnvFilePath);
  const oldEncryptedEnv = parse(oldEncryptedFile);
  const oldValues = await decryptValues(oldEncryptedEnv, kmsKeyId);

  const differentKeys = getObjectDifferences(oldValues, newValues);
  if (!differentKeys) {
    console.log("No differences. Skipping encryption step");
    return;
  }

  console.log("Encrypting changed keys:");
  differentKeys.forEach(console.log);

  const encryptedValues = await encryptValues(newValues, kmsKeyId);
  const newFileLines = toPairs(encryptedValues).map(outputEnvValue);
  const newFileContent = newFileLines.join(EOL);
  await writeFile(encryptedEnvFilePath, newFileContent);
}

async function decryptAndWrite(key: string): Promise<void> {
  const encryptedFile = await readFile(encryptedEnvFilePath);
  const encryptedEnv = parse(encryptedFile);
  const decrypted = await decryptValues(encryptedEnv, key);
  return writeFile(decryptedEnvFilePath, JSON.stringify(decrypted, null, 2));
}

async function run(): Promise<void> {
  const { argv } = yargs.usage(
    "Usage: $0 --key <KMS key ID> --[encrypt|decrypt]"
  );
  if (!argv.key) {
    throw new Error("Please provide a KMS key with the --key parameter");
  }
  const kmsKeyId = argv.key as string;

  if (argv.encrypt) {
    await encryptAndWrite(kmsKeyId);
    console.log(`Successfully encrypted values into ${encryptedEnvFilePath}`);
    return;
  }

  if (argv.decrypt) {
    await decryptAndWrite(kmsKeyId);
    console.log(`Successfully decrypted values into ${decryptedEnvFilePath}`);
    return;
  }

  throw new Error(
    "Unknown operation, please use one of [--encrypt, --decrypt]"
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
