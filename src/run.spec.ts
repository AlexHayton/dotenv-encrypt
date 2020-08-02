/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import { promisify } from "util";
import { v4 as uuid } from "uuid";
import { mockProcessExit, mockConsoleLog } from "jest-mock-process";
import yargs from "yargs";
import { encryptValues, decryptValues } from "./encrypt";
import { run } from "./run";

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

jest.mock("yargs");
jest.mock("./encrypt");

const mockEncryptValues = encryptValues as jest.Mock<any, any>;
mockEncryptValues.mockResolvedValue({
  KEY: "ENCRYPTED_VALUE",
});
const mockDecryptValues = decryptValues as jest.Mock<any, any>;
mockDecryptValues.mockResolvedValue({
  KEY: "VALUE",
});

describe("Running the CLI", () => {
  let exitMock: any;
  let logMock: any;
  let argvMock: any;
  beforeEach(() => {
    exitMock = mockProcessExit();
    logMock = mockConsoleLog();
    argvMock = { _: [] };
    yargs.help = jest.fn().mockReturnValue({ argv: argvMock });
    yargs.command = jest.fn().mockReturnValue(yargs);
    yargs.check = jest.fn().mockReturnValue(yargs);
    yargs.showHelp = jest.fn();
  });

  afterEach(() => {
    exitMock.mockRestore();
    logMock.mockRestore();
    mockEncryptValues.mockClear();
    mockEncryptValues.mockClear();
  });

  describe("Yargs setup", () => {
    beforeEach(run);

    it("should set up the encrypt command properly", async () => {
      expect(yargs.command).toHaveBeenCalledWith(
        "encrypt",
        "encrypts values",
        expect.any(Function)
      );
    });

    it("should set up the decrypt command properly", async () => {
      expect(yargs.command).toHaveBeenCalledWith(
        "decrypt",
        "decrypts values",
        expect.any(Function)
      );
    });

    it("should check for the KMS key", () => {
      expect(yargs.check).toHaveBeenCalled();
    });

    it("should display help", () => {
      expect(yargs.help).toHaveBeenCalled();
    });
  });

  describe("with a key provided", () => {
    beforeEach(async () => {
      argvMock.key = uuid();
      await unlink("./.env");
      await unlink("./.env.encrypted");
    });

    describe("encrypting", () => {
      beforeEach(async () => {
        argvMock._ = ["encrypt"];
        await writeFile("./.env", "KEY=VALUE");
      });

      it("can encrypt a file end-to-end when none exists yet", async () => {
        await run();

        expect(mockEncryptValues).toHaveBeenCalledWith(
          { KEY: "VALUE" },
          argvMock.key
        );
        expect(mockDecryptValues).not.toHaveBeenCalled();
        const encryptedFile = await readFile("./.env.encrypted");
        expect(encryptedFile.toString()).toEqual('KEY="ENCRYPTED_VALUE"');
      });

      it("skips encryption if the encrypted file hasn't changed", async () => {
        await writeFile("./.env.encrypted", 'KEY="ENCRYPTED_VALUE"');
        const fileStats = await stat("./.env.encrypted");

        await run();

        expect(mockEncryptValues).not.toHaveBeenCalled();
        const encryptedFile = await readFile("./.env.encrypted");
        expect(encryptedFile.toString()).toEqual('KEY="ENCRYPTED_VALUE"');
        const newFileStats = await stat("./.env.encrypted");
        expect(fileStats.mtimeMs).toEqual(newFileStats.mtimeMs);
      });
    });

    describe("decrypting", () => {
      beforeEach(async () => {
        argvMock._ = ["decrypt"];
        await writeFile("./.env.encrypted", 'KEY="ENCRYPTED_VALUE"');
      });

      it("can decrypt a file end-to-end", async () => {
        await run();

        expect(mockDecryptValues).toHaveBeenCalledWith(
          {
            KEY: "ENCRYPTED_VALUE",
          },
          argvMock.key
        );
        expect(mockEncryptValues).not.toHaveBeenCalled();
        const decryptedFile = await readFile("./.env");
        expect(decryptedFile.toString()).toEqual('KEY="VALUE"');
      });
    });
  });
});
