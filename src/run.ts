import fs from "fs";
import { promisify } from "util";
import yargs, { Argv } from "yargs";
import { EOL } from "os";
import toPairs from "lodash/toPairs";
import { decryptValues, encryptValues } from "./encrypt";
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

async function generateCommentLines(
  kmsKeyId: string,
  region: string
): Promise<string[]> {
  const pj = await import("../package.json");
  return [
    `# Generated with dotenv-decrypt-kms version ${pj.version}`,
    `# To decrypt please run "npx dotenv-encrypt-kms decrypt --key=${kmsKeyId} --region=${region}`,
  ];
}

async function writeToFile(
  commentLines: string[],
  values: StringKeyedObject,
  filePath: string
): Promise<void> {
  const newFileLines = toPairs(values).map(outputEnvValue);
  const newFileContent = [...commentLines, ...newFileLines].join(EOL);
  await writeFile(filePath, newFileContent);
}

async function encryptAndWrite(
  kmsKeyId: string,
  region: string
): Promise<void> {
  const newFile = await readFile(decryptedEnvFilePath);
  const newValues = parse(newFile);
  let oldEncryptedEnv: StringKeyedObject = {};
  let oldValues: StringKeyedObject = {};
  try {
    const oldEncryptedFile = await readFile(encryptedEnvFilePath);
    oldEncryptedEnv = parse(oldEncryptedFile);
    oldValues = await decryptValues(oldEncryptedEnv, kmsKeyId, region);
  } catch (error) {
    console.log("Creating encrypted file at", encryptedEnvFilePath);
  }

  const differences = getObjectDifferences(oldValues, newValues);
  if (checkForChanges(differences)) {
    const encryptedValues = await encryptValues(newValues, kmsKeyId, region);
    const commentLines = await generateCommentLines(kmsKeyId, region);
    writeToFile(commentLines, encryptedValues, encryptedEnvFilePath);
  }
}

async function decryptAndWrite(key: string, region: string): Promise<void> {
  const encryptedFile = await readFile(encryptedEnvFilePath);
  const encryptedEnv = parse(encryptedFile);
  const decryptedValues = await decryptValues(encryptedEnv, key, region);
  writeToFile([], decryptedValues, decryptedEnvFilePath);
}

interface Args {
  key: string;
  encrypt: boolean;
  decrypt: boolean;
}

const setupOptions = (commandOptions: Argv): Argv =>
  commandOptions
    .option("key", {
      alias: "k",
      description: "a KMS Key Id",
      string: true,
    })
    .option("region", {
      alias: "r",
      description: "an AWS region",
      string: true,
    });

export async function run(): Promise<void> {
  const { argv } = yargs
    .command<Args>("encrypt", "encrypts values", setupOptions)
    .command<Args>("decrypt", "decrypts values", setupOptions)
    .check((args) => {
      if (!args.key) {
        throw new Error("Please provide a KMS key with the --key parameter");
      }
      if (!args.region) {
        throw new Error("Please provide a region with the --region parameter");
      }
      return true;
    })
    .help();

  const [command] = argv._;
  const kmsKeyId = argv.key as string;
  const region = argv.region as string;

  switch (command) {
    case "encrypt": {
      await encryptAndWrite(kmsKeyId, region);
      console.log(`Successfully encrypted values into ${encryptedEnvFilePath}`);
      return;
    }

    case "decrypt": {
      await decryptAndWrite(kmsKeyId, region);
      console.log(`Successfully decrypted values into ${decryptedEnvFilePath}`);
      return;
    }

    default:
      yargs.showHelp();
  }
}
