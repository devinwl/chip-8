const { CPU, CPUError } = require("../../classes/CPU");
const { instructions } = require("../../constants/instructions");

describe("CPU", () => {
  test("Initialize the CPU.", () => {
    const subject = new CPU();

    expect(subject.memory).toEqual(new Uint8Array(4096));
    expect(subject.registers).toEqual(new Uint8Array(16));
    expect(subject.stack).toEqual(new Uint16Array(16));
    expect(subject.ST).toEqual(0);
    expect(subject.DT).toEqual(0);
    expect(subject.I).toEqual(0);
    expect(subject.SP).toEqual(-1);
    expect(subject.PC).toEqual(0x200);
  });

  test("Load data into memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    const subject = new CPU();
    subject.load(buffer);
    expect(subject.memory[0x200] | subject.memory[0x201]).toEqual(0x00e0);
  });

  test("Fetch next opcode from memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    const subject = new CPU();
    subject.load(buffer);

    const opcode = subject.fetch();
    expect(opcode).toEqual(0x00e0);
  });

  test("Throw an error when accessing out-of-bounds memory.", () => {
    const subject = new CPU();
    subject.PC = 4096;
    expect(() => subject.fetch()).toThrow(CPUError);
  });

  test("Decode a valid instruction.", () => {
    const instruction = instructions[0];
    const buffer = {
      data: [instruction.pattern],
    };

    const cpu = new CPU();
    cpu.load(buffer);

    const opcode = cpu.fetch();
    const subject = cpu.decode(opcode);

    expect(subject.pattern).toEqual(instruction.pattern);
  });

  test("Throw an error when decoding an invalid instruction.", () => {
    const buffer = {
      data: [0xffff],
    };

    const cpu = new CPU();
    cpu.load(buffer);

    const opcode = cpu.fetch();

    expect(() => cpu.decode(opcode)).toThrow(CPUError);
  });

  test("Increments the program counter by 2.", () => {
    const subject = new CPU();
    subject.nextInstruction();

    expect(subject.PC).toEqual(0x202);
  });

  test("Increments the program counter by 4.", () => {
    const subject = new CPU();
    subject.skipNextInstruction();

    expect(subject.PC).toEqual(0x204);
  });

  test("Determines instruction arguments properly.", () => {
    const instruction = instructions.find((instr) => instr.id === "LD_VX_KK");
    const x = 2;
    const kk = 0x00be; // 190 in decimal.
    const opcode = instruction.pattern | (x << 8) | kk;

    const subject = new CPU();
    const args = subject.args(opcode, instruction);

    expect(args.x).toEqual(x);
    expect(args.kk).toEqual(kk);
  });

  describe("Instructions", () => {
    test("LD_I_NNN", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_I_NNN");

      const nnn = 0x0123;
      const opcode = instruction.pattern | nnn;

      const subject = new CPU();
      const buffer = {
        data: [opcode],
      };

      subject.load(buffer);

      subject.step();

      expect(subject.I).toEqual(nnn);
      expect(subject.PC).toEqual(0x202);
    });

    test("LD_VX_KK", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_VX_KK");

      const x = 2;
      const kk = 0x00fe;
      const opcode = instruction.pattern | (x << 8) | kk;

      const subject = new CPU();
      const buffer = {
        data: [opcode],
      };

      subject.load(buffer);

      subject.step();

      expect(subject.registers[x]).toEqual(kk);
      expect(subject.PC).toEqual(0x202);
    });
  });
});
