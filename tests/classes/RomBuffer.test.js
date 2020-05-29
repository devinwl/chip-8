const fs = require("fs");

const { RomBuffer } = require("../../classes/RomBuffer");

jest.mock("fs");

describe("RomBuffer", () => {
  test("Reads a buffer and converts into big-endian opcodes.", () => {
    fs.readFileSync.mockImplementationOnce(() => {
      return [0xde, 0xad, 0xbe, 0xef];
    });

    const subject = new RomBuffer("foo");

    expect(subject.data[0]).toEqual(0xdead);
    expect(subject.data[1]).toEqual(0xbeef);
  });

  test("Dumps the data contents.", () => {
    fs.readFileSync.mockImplementationOnce(() => {
      return [0xde, 0xad, 0xbe, 0xef];
    });

    const romBuffer = new RomBuffer("foo");
    const subject = romBuffer.dump();

    expect(subject).toEqual("dead\nbeef");
  });
});
