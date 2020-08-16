import { getObjectDifferences } from "./util";

describe("getObjectDifferences", () => {
  const original = {
    KEY1: "VALUE",
  };
  it("detects a new key in the object", () => {
    const newObject = {
      ...original,
      KEY2: "VALUE2",
    };
    expect(getObjectDifferences(original, newObject)).toEqual({
      changedKeys: ["KEY2"],
      removedKeys: [],
    });
  });

  it("detects a changed key in the new object", () => {
    const newObject = {
      KEY1: "VALUE2",
    };
    expect(getObjectDifferences(original, newObject)).toEqual({
      changedKeys: ["KEY1"],
      removedKeys: [],
    });
  });

  it("detects a missing key in the new object", () => {
    const newObject = {};
    expect(getObjectDifferences(original, newObject)).toEqual({
      changedKeys: [],
      removedKeys: ["KEY1"],
    });
  });

  it("deals with it when the objects are the same", () => {
    const newObject = {
      ...original,
    };
    expect(getObjectDifferences(original, newObject)).toEqual({
      changedKeys: [],
      removedKeys: [],
    });
  });

  it("deals with it when the objects are both empty", () => {
    expect(getObjectDifferences({}, {})).toEqual({
      changedKeys: [],
      removedKeys: [],
    });
  });
});
