/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { mockProcessExit, mockConsoleLog } from "jest-mock-process";
import yargs from "yargs";
import { encryptValues, decryptValues } from "../../dotenv-encrypt-kms/src/encrypt";
import { run } from "./run";

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

jest.mock("yargs");
jest.mock("./encrypt");

const DECRYPTED_FILENAME = "./.env";
const ENCRYPTED_FILENAME = "./.env.encrypted";

describe("Running the CLI", () => {
  let exitMock: any;
  let logMock: any;
  let argvMock: any;
  let mockEncryptFunc: jest.Mock;
  let mockDecryptFunc: jest.Mock;
  let mockYargsOptionsFunction: jest.Mock;
  let mockCheckFunction: jest.Mock;
  beforeEach(() => {
    exitMock = mockProcessExit();
    logMock = mockConsoleLog();
    argvMock = { _: [] };
    yargs.help = jest.fn().mockReturnValue({ argv: argvMock });
    yargs.command = jest.fn().mockReturnValue(yargs);
    yargs.check = jest.fn().mockReturnValue(yargs);
    yargs.showHelp = jest.fn();
    mockEncryptFunc = jest.fn().mockResolvedValue("ENCRYPTED_VALUE");
    mockDecryptFunc = jest.fn().mockResolvedValue("VALUE");
    mockYargsOptionsFunction = jest.fn();
    mockCheckFunction = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    exitMock.mockRestore();
    logMock.mockRestore();
    mockEncryptFunc.mockReset();
    mockDecryptFunc.mockReset();
    mockYargsOptionsFunction.mockReset();
    mockCheckFunction.mockReset();
  });

  describe("Yargs setup", () => {
    beforeEach(run);

    it("should set up the encrypt command properly", async () => {
      expect(yargs.command).toHaveBeenCalledWith(
        "encrypt",
        "encrypts values",
        mockYargsOptionsFunction,
      );
    });

    it("should set up the decrypt command properly", async () => {
      expect(yargs.command).toHaveBeenCalledWith(
        "decrypt",
        "decrypts values",
        mockYargsOptionsFunction,
      );
    });

    it("should check for the KMS key", () => {
      expect(yargs.check).toHaveBeenCalledWith(mockCheckFunction);
    });

    it("should display help", () => {
      expect(yargs.help).toHaveBeenCalled();
    });
  });

  describe("with a key provided", () => {
    beforeEach(async () => {
      argvMock.key = uuid();
      if (await exists(DECRYPTED_FILENAME)) {
        await unlink(DECRYPTED_FILENAME);
      }
      if (await exists(ENCRYPTED_FILENAME)) {
        await unlink(ENCRYPTED_FILENAME);
      }
    });

    describe("encrypting", () => {
      beforeEach(async () => {
        argvMock._ = ["encrypt"];
        await writeFile(DECRYPTED_FILENAME, "KEY=VALUE");
      });

      it("can encrypt a file end-to-end when none exists yet", async () => {
        await run();

        expect(mockEncryptFunc).toHaveBeenCalledWith("VALUE");
        expect(mockDecryptFunc).not.toHaveBeenCalled();
        const encryptedFile = await readFile(ENCRYPTED_FILENAME);
        expect(encryptedFile.toString()).toEqual('KEY="ENCRYPTED_VALUE"');
      });

      it("skips encryption if the encrypted file hasn't changed", async () => {
        await writeFile(ENCRYPTED_FILENAME, 'KEY="ENCRYPTED_VALUE"');
        const fileStats = await stat(ENCRYPTED_FILENAME);

        await run();

        expect(mockDecryptFunc).toHaveBeenCalledWith("ENCRYPTED_VALUE");
        expect(mockEncryptFunc).toHaveBeenCalledWith("VALUE");
        const encryptedFile = await readFile(ENCRYPTED_FILENAME);
        expect(encryptedFile.toString()).toEqual('KEY="ENCRYPTED_VALUE"');
        const newFileStats = await stat(ENCRYPTED_FILENAME);
        expect(fileStats.mtimeMs).toEqual(newFileStats.mtimeMs);
      });

      it("encrypts the file again if the encrypted file changed", async () => {
        await writeFile(ENCRYPTED_FILENAME, 'KEY="ENCRYPTED_VALUE"');
        const fileStats = await stat(ENCRYPTED_FILENAME);

        await run();

        expect(mockDecryptFunc).toHaveBeenCalledWith("ENCRYPTED_VALUE");
        expect(mockEncryptFunc).toHaveBeenCalledWith("VALUE");
        const encryptedFile = await readFile(ENCRYPTED_FILENAME);
        expect(encryptedFile.toString()).toEqual('KEY="ENCRYPTED_VALUE"');
        const newFileStats = await stat(ENCRYPTED_FILENAME);
        expect(fileStats.mtimeMs).toEqual(newFileStats.mtimeMs);
      });
    });

    describe("decrypting", () => {
      beforeEach(async () => {
        argvMock._ = ["decrypt"];
        await writeFile(ENCRYPTED_FILENAME, 'KEY="ENCRYPTED_VALUE"');
      });

      it("can decrypt a file end-to-end", async () => {
        await run();

        expect(mockDecryptFunc).toHaveBeenCalledWith("ENCRYPTED_VALUE");
        expect(mockEncryptFunc).not.toHaveBeenCalled();
        const decryptedFile = await readFile(DECRYPTED_FILENAME);
        expect(decryptedFile.toString()).toEqual('KEY="VALUE"');
      });
    });
  });
});
