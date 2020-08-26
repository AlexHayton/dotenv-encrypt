import fs from "fs";
import { promisify } from "util";
import yargs, { Argv, Arguments } from "yargs";
import { EOL } from "os";
import toPairs from "lodash/toPairs";
import { parse } from "./parse";
import { encryptValues, decryptValues } from "./encrypt";
import {
  getObjectDifferences,
  outputEnvValue,
  ObjectDifferences,
} from "./util";
import { StringKeyedObject, DecryptFunction, EncryptFunction } from "./types";

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

async function encryptAndWrite(encryptFunc: EncryptFunction, decryptFunc: DecryptFunction): Promise<void> {
  const newFile = await readFile(decryptedEnvFilePath);
  const newValues = parse(newFile);
  let oldEncryptedEnv: StringKeyedObject = {};
  let oldValues: StringKeyedObject = {};
  try {
    const oldEncryptedFile = await readFile(encryptedEnvFilePath);
    oldEncryptedEnv = parse(oldEncryptedFile);
    oldValues = await decryptValues(oldEncryptedEnv, decryptFunc);
  } catch (error) {
    console.log("Creating encrypted file at", encryptedEnvFilePath);
  }

  const differences = getObjectDifferences(oldValues, newValues);
  if (checkForChanges(differences)) {
    const encryptedValues = await encryptValues(newValues, encryptFunc);
    writeToFile(encryptedValues, encryptedEnvFilePath);
  }
}

async function decryptAndWrite(decryptFunc: DecryptFunction): Promise<void> {
  const encryptedFile = await readFile(encryptedEnvFilePath);
  const encryptedEnv = parse(encryptedFile);
  const decryptedValues = await decryptValues(encryptedEnv, decryptFunc);
  writeToFile(decryptedValues, decryptedEnvFilePath);
}

interface Args {
  encrypt: boolean;
  decrypt: boolean;
}

export interface RunCommandOptions<T extends Args> {
  decryptFunc: (argv: Arguments<T>) => DecryptFunction;
  encryptFunc: (argv: Arguments<T>) => EncryptFunction;
  checkArgs: (argv: Arguments<T>) => boolean;
  setupYargsOptions: (commandOptions: Argv) => Argv;
}

export async function run<T extends Args>(options: RunCommandOptions<T>): Promise<void> {
  const { argv } = yargs
    .command<T>("encrypt", "encrypts values", options.setupYargsOptions)
    .command<T>("decrypt", "decrypts values", options.setupYargsOptions)
    .check(options.checkArgs)
    .help();

  const [command] = argv._;

  const encrypt = options.encryptFunc(argv);
  const decrypt = options.decryptFunc(argv);

  switch (command) {
    case "encrypt": {
      await encryptAndWrite(encrypt, decrypt);
      console.log(`Successfully encrypted values into ${encryptedEnvFilePath}`);
      return;
    }

    case "decrypt": {
      await decryptAndWrite(decrypt);
      console.log(`Successfully decrypted values into ${decryptedEnvFilePath}`);
      return;
    }

    default:
      yargs.showHelp();
  }
}
