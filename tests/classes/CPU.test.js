const { CPU, CPUError } = require("../../classes/CPU");
const { instructions } = require("../../constants/instructions.constant");
const { SCREEN_WIDTH, SCREEN_HEIGHT } = require("../../constants/CPU.constant");

describe("CPU", () => {
  const cpu = new CPU();

  beforeEach(() => {
    cpu.reset();
  });

  test("Initialize the CPU.", () => {
    expect(cpu.memory).toEqual(new Uint8Array(4096));
    expect(cpu.registers).toEqual(new Uint8Array(16));
    expect(cpu.stack).toEqual(new Uint16Array(16));
    expect(cpu.ST).toEqual(0);
    expect(cpu.DT).toEqual(0);
    expect(cpu.I).toEqual(0);
    expect(cpu.SP).toEqual(-1);
    expect(cpu.PC).toEqual(0x200);

    expect(cpu.display).toEqual(
      new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0)
    );
  });

  test("Load data into memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    cpu.load(buffer);
    expect(cpu.memory[0x200] | cpu.memory[0x201]).toEqual(0x00e0);
  });

  test("Fetch next opcode from memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();
    expect(opcode).toEqual(0x00e0);
  });

  test("Throw an error when accessing out-of-bounds memory.", () => {
    cpu.PC = 4096;
    expect(() => cpu.fetch()).toThrow(CPUError);
  });

  test("Decode a valid instruction.", () => {
    const instruction = instructions[0];
    const buffer = {
      data: [instruction.pattern],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();
    const subject = cpu.decode(opcode);

    expect(subject.pattern).toEqual(instruction.pattern);
  });

  test("Throw an error when decoding an invalid instruction.", () => {
    const buffer = {
      data: [0xffff],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();

    expect(() => cpu.decode(opcode)).toThrow(CPUError);
  });

  test("Increments the program counter by 2.", () => {
    cpu.nextInstruction();

    expect(cpu.PC).toEqual(0x202);
  });

  test("Increments the program counter by 4.", () => {
    cpu.skipNextInstruction();

    expect(cpu.PC).toEqual(0x204);
  });

  test("Determines instruction arguments properly.", () => {
    const instruction = instructions.find((instr) => instr.id === "LD_VX_KK");
    const x = 2;
    const kk = 0x00be; // 190 in decimal.
    const opcode = instruction.pattern | (x << 8) | kk;

    const args = cpu.args(opcode, instruction);

    expect(args.x).toEqual(x);
    expect(args.kk).toEqual(kk);
  });

  describe("Instructions", () => {
    beforeEach(() => {
      cpu.reset();
    });

    test("LD_I_NNN", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_I_NNN");

      const nnn = 0x0123;
      const opcode = instruction.pattern | nnn;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.I).toEqual(nnn);
      expect(cpu.PC).toEqual(0x202);
    });

    test("LD_VX_KK", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_VX_KK");

      const x = 2;
      const kk = 0x00fe;
      const opcode = instruction.pattern | (x << 8) | kk;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.step();

      expect(cpu.registers[x]).toEqual(kk);
      expect(cpu.PC).toEqual(0x202);
    });

    test("ADD_VX_KK", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "ADD_VX_KK"
      );

      const x = 3;
      const vx = 0x0002;
      const kk = 0x0022;
      const opcode = instruction.pattern | (x << 8) | kk;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.registers[x] = vx;

      cpu.step();

      expect(cpu.registers[x]).toEqual(vx + kk);
      expect(cpu.PC).toEqual(0x202);
    });

    test("JP_NNN", () => {
      const instruction = instructions.find((instr) => instr.id === "JP_NNN");

      const nnn = 0x228;
      const opcode = instruction.pattern | nnn;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.step();

      expect(cpu.PC).toEqual(nnn);
    });
  });
});
