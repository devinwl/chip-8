const { instructions } = require("../constants/instructions.constant");
const { SCREEN_WIDTH, SCREEN_HEIGHT } = require("../constants/CPU.constant");
const FONTS = require("../constants/fonts.constant");

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

    // Each pixel is treated as on or off, like a bit.
    // To get (x,y), multiple y by `SCREEN_WIDTH`, then add x.
    // e.g. (12, 8). 8 * 64 = 512. 512 + 12 = 524. 524th pixel!
    this.display = new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0);

    // Debug flag. If true, outputs each instruction.
    this.debug = false;
  }

  /**
   * Load the data in the Buffer (from RomBuffer) into
   * the CPU's memory.
   * @param {Buffer} romBuffer
   */
  load({ data: romBuffer }) {
    for (let i = 0; i < FONTS.length; i++) {
      this.memory[i] = FONTS[i];
    }

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
      this.throw("Memory out-of-bounds.");
    }

    const opcode =
      (this.memory[this.PC] << 8) | (this.memory[this.PC + 1] << 0);

    this.nextInstruction();

    return opcode;
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
      this.throw(`Invalid instruction "${this._int16ToHex(opcode)}" found.`);
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

    /* istanbul ignore next */
    if (this.debug) {
      const args = this.args(opcode, instruction);

      const output = instruction.arguments.reduce((acc, arg) => {
        return acc.replace(arg.id, args[arg.id]);
      }, instruction.instruction);

      console.log(`${this._int16ToHex(opcode)} // ${output}`);
    }
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
        this.display.fill(0);
        break;
      }

      case "LD_I_NNN": {
        const { nnn } = args;
        this.I = nnn;

        break;
      }

      case "LD_VX_KK": {
        const { x, kk } = args;
        this.registers[x] = kk;
        break;
      }

      case "ADD_VX_KK": {
        const { x, kk } = args;
        this.registers[x] = this.registers[x] + kk;
        break;
      }

      case "JP_NNN": {
        const { nnn } = args;
        this.PC = nnn;
        break;
      }

      case "DRW_VX_VY_N": {
        const { x, y, n } = args;
        const vx = this.registers[x];
        const vy = this.registers[y];

        // Read `n` bytes of memory.
        for (let row = 0; row < n; row++) {
          // Each row is 8 bits. This represents 1
          // row pixels 8 pixels wide.
          const line = this.memory[this.I + row];

          // Get each bit (there are 8).
          for (let bit = 0; bit < 8; bit++) {
            const pixel = line & (1 << (7 - bit)) ? 1 : 0;

            // To calculate where to draw the pixel, we need
            // the starting points (Vx, Vy).
            // To find the correct y position, we multiply it by
            // 64 (`SCREEN_WIDTH`) and the current byte we are
            // on. Then we add the x position, plus the bit we
            // are currently writing horizontally.
            const vx_vy = SCREEN_WIDTH * (vy + row) + (vx + bit);

            // If we attempt to draw on a pixel that is already there,
            // then we have a pixel collision. Need to set Vf = 1.
            // Else set Vf = 0.
            if (this.display[vx_vy] && pixel) {
              this.registers[0xf] = 1;
            } else {
              this.registers[0xf] = 0;
            }

            this.display[vx_vy] = this.display[vx_vy] ^ pixel;
          }
        }
      }

      case "SE_VX_KK": {
        const { x, kk } = args;

        if (this.registers[x] === kk) {
          this.nextInstruction();
        }

        break;
      }

      case "SNE_VX_KK": {
        const { x, kk } = args;

        if (this.registers[x] !== kk) {
          this.nextInstruction();
        }

        break;
      }

      case "SE_VX_VY": {
        const { x, y } = args;

        if (this.registers[x] === this.registers[y]) {
          this.nextInstruction();
        }

        break;
      }

      case "SNE_VX_VY": {
        const { x, y } = args;

        if (this.registers[x] !== this.registers[y]) {
          this.nextInstruction();
        }

        break;
      }

      case "CALL_NNN": {
        const { nnn } = args;

        this.SP++;
        this.stack[this.SP] = this.PC;
        this.PC = nnn;

        break;
      }

      case "RET": {
        this.PC = this.stack[this.SP];
        this.SP--;

        break;
      }

      case "LD_VX_VY": {
        const { x, y } = args;

        this.registers[x] = this.registers[y];

        break;
      }

      case "OR_VX_VY": {
        const { x, y } = args;

        this.registers[x] = this.registers[x] | this.registers[y];

        break;
      }

      case "AND_VX_VY": {
        const { x, y } = args;

        this.registers[x] = this.registers[x] & this.registers[y];

        break;
      }

      case "XOR_VX_VY": {
        const { x, y } = args;

        this.registers[x] = this.registers[x] ^ this.registers[y];

        break;
      }

      case "ADD_VX_VY": {
        const { x, y } = args;
        const result = this.registers[x] + this.registers[y];

        const carry = (result & 0x0f00) >> 8;
        if (carry) {
          this.registers[0xf] = 1;
        } else {
          this.registers[0xf] = 0;
        }

        this.registers[x] = result & 0x00ff;

        break;
      }

      case "SUB_VX_VY": {
        const { x, y } = args;
        if (this.registers[x] > this.registers[y]) {
          this.registers[0xf] = 1;
        } else {
          this.registers[0xf] = 0;
        }

        this.registers[x] = this.registers[x] - this.registers[y];

        break;
      }

      case "SHR_VX_VY": {
        // I'm not sure why Vy is permitted, because it's never used in this.
        const { x } = args;

        if (this.registers[x] & 0b1) {
          this.registers[0xf] = 1;
        } else {
          this.registers[0xf] = 0;
        }

        this.registers[x] = this.registers[x] >> 1;

        break;
      }

      case "SHL_VX_VY": {
        // I'm not sure why Vy is permitted, because it's never used in this.
        const { x } = args;

        if (this.registers[x] >> 7) {
          this.registers[0xf] = 1;
        } else {
          this.registers[0xf] = 0;
        }

        this.registers[x] = this.registers[x] << 1;

        break;
      }

      case "LD_DT_VX": {
        const { x } = args;

        this.DT = this.registers[x];

        break;
      }

      case "LD_I_VX": {
        const { x } = args;

        for (let i = 0; i <= x; i++) {
          this.memory[this.I + i] = this.registers[i];
        }

        break;
      }

      case "LD_VX_I": {
        const { x } = args;

        for (let i = 0; i <= x; i++) {
          this.registers[i] = this.memory[this.I + i];
        }

        break;
      }

      case "LD_B_VX": {
        // Cheating a little because values in registers are 0-255,
        // so we can do a little quick maffs (divide by 10, etc) to
        // get the BCD.
        const { x } = args;
        const num = this.registers[x];

        const ones = num % 10;
        const tens = Math.floor((num / 10) % 10);
        const hundreds = Math.floor(num / 100);

        this.memory[this.I] = hundreds;
        this.memory[this.I + 1] = tens;
        this.memory[this.I + 2] = ones;

        break;
      }

      case "SUBN_VX_VY": {
        const { x, y } = args;

        if (this.registers[y] > this.registers[x]) {
          this.registers[0xf] = 1;
        } else {
          this.registers[0xf] = 0;
        }

        this.registers[x] = this.registers[y] - this.registers[x];

        break;
      }

      case "LD_F_VX": {
        const { x } = args;

        // Multiply by 5 because that's the height of a sprite.
        // If we want character 0xd (13), multiply by 5 (65)
        // to find the starting address of the sprite (0x41)
        this.I = this.registers[x] * 5;

        break;
      }

      case "ADD_I_VX": {
        const { x } = args;

        this.I = this.I + this.registers[x];

        break;
      }

      /* istanbul ignore next */
      default: {
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

  enableDebug() {
    this.debug = true;
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
  /* istanbul ignore next */
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
   * Reset the CPU to its starting state.
   * Primarily a helper for testing. Usually
   * won't reset the CPU during execution.
   */
  reset() {
    this.memory = new Uint8Array(4096);
    this.registers = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.ST = 0;
    this.DT = 0;
    this.I = 0;
    this.SP = -1;
    this.PC = 0x200;

    this.display = new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0);
  }

  /* istanbul ignore next */
  dumpDisplay() {
    for (let i = 0; i < SCREEN_HEIGHT; i++) {
      let row = "";
      for (let j = 0; j < SCREEN_WIDTH; j++) {
        row = row.concat(this.display[i * SCREEN_WIDTH + j] ? "█" : " ");
      }
      console.log(row);
    }
  }

  /* instanbul ignore next */
  humanReadableInstruction(opcode, instruction) {
    const args = this.args(opcode, instruction);

    const output = instruction.arguments.reduce((acc, arg) => {
      return acc.replace(arg.id, args[arg.id]);
    }, instruction.instruction);

    return `${this._int16ToHex(opcode)} // ${output}`;
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

class CPUError extends Error {
  constructor(
    message,
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

module.exports = {
  CPU,
  CPUError,
};
