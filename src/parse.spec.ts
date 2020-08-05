import fs from "fs";
import { promisify } from "util";
import { parse } from "./parse";

const readFile = promisify(fs.readFile);

describe("Parsing", () => {
  it("Deals with an empty file", async () => {
    const emptyFile = await readFile("./test/.env.empty");
    expect(parse(emptyFile)).toEqual({});
  });

  describe("with a real file", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    beforeAll(async () => {
      const file = await readFile("./test/.env.sample");
      parsed = await parse(file);
    });

    it("correctly parses an empty key", () => {
      expect(parsed.EMPTY).toEqual("");
    });

    it("correctly parses an empty quoted key", () => {
      expect(parsed.EMPTY_QUOTED).toEqual("");
    });

    it("correctly parses a standard key", () => {
      expect(parsed.KEY).toEqual("VALUE");
    });

    it("correctly parses a key with non-ASCII characters", () => {
      expect(parsed.RAMEN).toEqual("ラーメン大好き");
    });

    it("correctly parses emoji", () => {
      expect(parsed.EMOJI).toEqual("🦄");
    });

    it("correctly parses a quoted string", () => {
      expect(parsed.QUOTED).toEqual("Play it again, Sam");
    });

    it("correctly parses a single-quoted string", () => {
      expect(parsed.SINGLE_QUOTED).toEqual("Again!");
    });

    it("correctly parses a multiline string", () => {
      const expected = `Lo! Death has reared himself a throne\nIn a strange city lying alone\nFar down within the dim West,\nWhere the good and the bad and the worst and the best\nHave gone to their eternal rest.`;
      expect(parsed.MULTILINE).toEqual(expected);
    });
  });
});
