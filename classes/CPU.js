const { instructions } = require("../constants/instructions");

class CPUError extends Error {
  constructor(
    message,
    instruction = {},
    PC = 0x0,
    registers = [],
    stack = [],
    ST = -1,
    DT = -1,
    I = -1,
    SP = -1,
    memory = {}
  ) {
    super(message);

    this.name = "CPUError";

    this.message = message;
    this.instruction = instruction;
    this.PC = PC;
    this.registers = registers;
    this.cpuStack = stack;
    this.ST = ST;
    this.DT = DT;
    this.I = I;
    this.SP = SP;
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

    // The display is represented with Boolean values.
    // `true` means the pixel is on, `false` is off.
    this.display = new Array(64)
      .fill(false)
      .map(() => new Array(32).fill(false));
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
      this.throw("Memory out of bounds.");
    }

    return (this.memory[this.PC] << 8) | (this.memory[this.PC + 1] << 0);
  }

  /**
   * Decodes the given `opcode` into an instruction object.
   * @param {*} opcode
   */
  decode(opcode) {
    const instruction = instructions.find(
      (instr) => (opcode & instr.mask) === instr.pattern
    );

    if (!instruction) {
      this.throw("Invalid instruction found.");
    }

    return instruction;
  }

  /**
   * Runs the current instruction.
   */
  step() {
    const opcode = this.fetch();
    const instruction = this.decode(opcode);

    this.execute(opcode, instruction);
  }

  /**
   * Executes the `opcode` using data from `instruction`.
   * @param {Uint16} opcode Opcode from memory.
   * @param {Object} instruction Instruction data from decoded opcode.
   */
  execute(opcode, instruction) {
    // Determine args (if any).
    const args = this.args(opcode, instruction);

    switch (instruction.id) {
      case "CLS": {
        // TODO: Implement this.
        this.nextInstruction();
        break;
      }

      case "LD_I_NNN": {
        this.I = args["nnn"];

        this.nextInstruction();
        break;
      }

      case "LD_VX_KK": {
        this.registers[args["x"]] = args["kk"];
        this.nextInstruction();
        break;
      }

      default: {
        this.nextInstruction();
        break;
      }
    }
  }

  /**
   * Given an `opcode` and its decoded `instruction`,
   * return an object containinng the opcode's arguments
   * mapped to an object using each argument's `id` key.
   * @param {*} opcode
   * @param {*} instruction
   */
  args(opcode, instruction) {
    const args = instruction.arguments;
    return args.reduce((obj, arg) => {
      // Bitwise AND with `arg.mask` to isolate the argument.
      // Then, shift it over `arg.shift` bytes to get the actual value.
      return {
        [arg.id]: (opcode & arg.mask) >> arg.shift,
        ...obj,
      };
    }, {});
  }

  /**
   * Go to the next instruction in memory, which is
   * the next 2 bytes.
   */
  nextInstruction() {
    this.PC = this.PC + 2;
  }

  /**
   * Skip to the instruction after the next, which
   * is ahead 4 bytes.
   */
  skipNextInstruction() {
    this.PC = this.PC + 4;
  }

  /**
   * Prints out the current instruction in a human-
   * readable way.
   */
  debug() {
    const opcode = this.fetch();
    const instruction = this.decode(opcode);
    const args = this.args(opcode, instruction);

    const output = instruction.arguments.reduce((acc, arg) => {
      return acc.replace(arg.id, args[arg.id]);
    }, instruction.instruction);

    console.log(output, this._int16ToHex(opcode));
  }

  /**
   * Throws a `CPUError` error with param `message.
   * Included is a full dump of the CPU at the time of
   * the error.
   * @param {*} message
   */
  throw(message) {
    throw new CPUError(
      message,
      this._int16ToHex(this.fetch()),
      this._intToHex(this.PC),
      this.registers,
      this.stack,
      this._intToHex(this.ST),
      this._intToHex(this.DT),
      this._intToHex(this.I),
      this._intToHex(this.SP),
      this.memory
    );
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
