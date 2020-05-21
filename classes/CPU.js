const { instructions } = require("../constants/instructions");

class CPUError extends Error {
  constructor(message, instruction = {}, address = 0x0, memory = {}) {
    super(message);

    this.message = message;
    this.name = "CPUError";
    this.instruction = instruction;
    this.address = address;
    this.memory = memory;
  }
}

class CPU {
  constructor() {
    this.memory = new Uint8Array(4096);
    this.registers = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.ST = 0; // Sound timer
    this.DT = 0; // Delay timer
    this.I = 0; // Index register
    this.SP = -1; // Stack pointer
    this.PC = 0x200; // Program counter
  }

  /**
   * Load the data in the Buffer (from RomBuffer) into
   * the CPU's memory.
   * @param {Buffer} romBuffer
   */
  load({ data: romBuffer }) {
    // The first 0x000-0x200 bytes are reserved.
    // Storage begins at 0x200 for programs.
    const memStart = 0x200;

    // Each opcode is 16 bits, and memory stores 8 bit per index.
    // We need to break up each opcode into 8 bit operators.
    // Nibble 1 is the most significant bits.
    // Nibble 2 is the least significant bits.
    // Therefore an entire instruction is stored at index i and i+1.
    for (let i = 0; i < romBuffer.length; i++) {
      const addr = memStart + i * 2;
      this.memory[addr] = romBuffer[i] >> 8;
      this.memory[addr + 1] = romBuffer[i] & 0x00ff;
    }
  }

  /**
   * Fetches the current instruction at the PC.
   * The current instruction is the combination of the 8 bits
   * located at PC and PC + 1. They are OR'd to form the 16-bit
   * opcode.
   */
  fetch() {
    if (this.PC > 4094) {
      throw new CPUError(
        "Memory out of bounds.",
        undefined,
        this._intToHex(this.PC),
        this.memory
      );
    }

    return (this.memory[this.PC] << 8) | (this.memory[this.PC + 1] << 0);
  }

  decode(opcode) {
    const instruction = instructions.find(
      (instr) => (opcode & instr.mask) === instr.pattern
    );

    if (!instruction) {
      throw new CPUError(
        "Invalid instruction found.",
        this._int16ToHex(this.fetch()),
        this._intToHex(this.PC),
        this.memory
      );
    }

    return instruction;
  }

  step() {
    const opcode = this.fetch();
    const instruction = this.decode(opcode);

    // TODO: Execute `instruction`.

    // TODO: This won't always be the case, depending on the instruction.
    this.PC = this.PC + 2;
  }

  /**
   * Dump the entire memory of CPU.
   */
  dump(startingFrom = 0x0) {
    const lines = [];

    for (let i = 0; i < this.memory.length; i++) {
      const addr = startingFrom + i * 2;
      this.memory[addr] !== undefined &&
        lines.push(
          this.memory[addr].toString(16).padStart(2, "0") +
            this.memory[addr + 1].toString(16).padStart(2, "0")
        );
    }

    return lines.join("\n");
  }

  /**
   * Convert an Uint8 to hex.
   * @param {*} int8
   */
  _intToHex(int) {
    return int.toString(16).padStart(2, "0");
  }

  /**
   * Convert a Uint16 to hex.
   * @param {*} int16
   */
  _int16ToHex(int16) {
    return int16.toString(16).padStart(4, "0");
  }
}

module.exports = {
  CPU,
};
