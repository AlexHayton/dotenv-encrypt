import fs from "fs";
import { promisify } from "util";
import yargs, { Argv } from "yargs";
import { EOL } from "os";
import toPairs from "lodash/toPairs";
import { parse } from "./parse";
import {
  getObjectDifferences,
  outputEnvValue,
  ObjectDifferences,
} from "./util";
import { StringKeyedObject } from "./types";

const decryptedEnvFilePath = "./.env";
const encryptedEnvFilePath = "./.env.encrypted";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function checkForChanges({
  changedKeys,
  removedKeys,
}: ObjectDifferences): boolean {
  if (changedKeys.length + removedKeys.length === 0) {
    console.log("No differences. Skipping encryption step");
    return false;
  }

  if (changedKeys.length > 0) {
    console.log("Encrypting changed keys:");
    changedKeys.forEach(console.log);
    console.log("");
  }

  if (removedKeys.length > 0) {
    console.log("The following keys were removed:");
    changedKeys.forEach(console.log);
    console.log("");
  }
  return true;
}

async function writeToFile(values: StringKeyedObject, filePath: string): Promise<void> {
  const newFileLines = toPairs(values).map(outputEnvValue);
  const newFileContent = newFileLines.join(EOL);
  await writeFile(filePath, newFileContent);
}

async function encryptAndWrite(kmsKeyId: string): Promise<void> {
  const newFile = await readFile(decryptedEnvFilePath);
  const newValues = parse(newFile);
  let oldEncryptedEnv: StringKeyedObject = {};
  let oldValues: StringKeyedObject = {};
  try {
    const oldEncryptedFile = await readFile(encryptedEnvFilePath);
    oldEncryptedEnv = parse(oldEncryptedFile);
    oldValues = await decryptValues(oldEncryptedEnv, kmsKeyId);
  } catch (error) {
    console.log("Creating encrypted file at", encryptedEnvFilePath);
  }

  const differences = getObjectDifferences(oldValues, newValues);
  if (checkForChanges(differences)) {
    const encryptedValues = await encryptValues(newValues, kmsKeyId);
    writeToFile(encryptedValues, encryptedEnvFilePath);
  }
}

async function decryptAndWrite(key: string): Promise<void> {
  const encryptedFile = await readFile(encryptedEnvFilePath);
  const encryptedEnv = parse(encryptedFile);
  const decryptedValues = await decryptValues(encryptedEnv, key);
  writeToFile(decryptedValues, decryptedEnvFilePath);
}

interface Args {
  key: string;
  encrypt: boolean;
  decrypt: boolean;
}
export async function run(): Promise<void> {
  const { argv } = yargs
    .command<Args>("encrypt", "encrypts values", (commandOptions: Argv) =>
      commandOptions.option("key", {
        alias: "k",
        description: "a KMS Key Id",
        string: true,
      })
    )
    .command<Args>("decrypt", "decrypts values", (commandOptions: Argv) =>
      commandOptions.option("key", {
        alias: "k",
        description: "a KMS Key Id",
        string: true,
      })
    )
    .check((args) => {
      if (!args.key) {
        throw new Error("Please provide a KMS key with the --key parameter");
      }
      return true;
    })
    .help();

  const [command] = argv._;
  const kmsKeyId = argv.key as string;

  switch (command) {
    case "encrypt": {
      await encryptAndWrite(encyptFunc);
      console.log(`Successfully encrypted values into ${encryptedEnvFilePath}`);
      return;
    }

    case "decrypt": {
      await decryptAndWrite(encryptFunc);
      console.log(`Successfully decrypted values into ${decryptedEnvFilePath}`);
      return;
    }

    default:
      yargs.showHelp();
  }
}
