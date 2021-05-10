const { CPU, CPUError } = require("../../classes/CPU");
const { instructions } = require("../../constants/instructions.constant");
const { SCREEN_WIDTH, SCREEN_HEIGHT } = require("../../constants/CPU.constant");

describe("CPU", () => {
  const cpu = new CPU();

  beforeEach(() => {
    cpu.reset();
  });

  it("Initializes the CPU.", () => {
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

  it("Loads data into memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    cpu.load(buffer);
    expect(cpu.memory[0x200] | cpu.memory[0x201]).toEqual(0x00e0);
  });

  it("Fetches next opcode from memory.", () => {
    const buffer = {
      data: [0x00e0],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();
    expect(opcode).toEqual(0x00e0);
  });

  it("Throws an error when accessing out-of-bounds memory.", () => {
    cpu.PC = 4096;
    expect(() => cpu.fetch()).toThrow(CPUError);
  });

  it("Decodes a valid instruction.", () => {
    const instruction = instructions[0];
    const buffer = {
      data: [instruction.pattern],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();
    const subject = cpu.decode(opcode);

    expect(subject.pattern).toEqual(instruction.pattern);
  });

  it("Throws an error when decoding an invalid instruction.", () => {
    const buffer = {
      data: [0xffff],
    };

    cpu.load(buffer);

    const opcode = cpu.fetch();

    expect(() => cpu.decode(opcode)).toThrow(CPUError);
  });

  it("Increments the program counter by 2.", () => {
    cpu.nextInstruction();

    expect(cpu.PC).toEqual(0x202);
  });

  it("Increments the program counter by 4.", () => {
    cpu.skipNextInstruction();

    expect(cpu.PC).toEqual(0x204);
  });

  it("Determines instruction arguments properly.", () => {
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

    it("CLS", () => {
      const instruction = instructions.find((instr) => instr.id === "CLS");

      const opcode = instruction.pattern;

      const buffer = {
        data: [opcode],
      };

      cpu.display.fill(1);

      cpu.load(buffer);

      cpu.step();

      expect(cpu.display).toEqual(
        new Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0)
      );
    });

    it("LD_I_NNN", () => {
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

    it("LD_VX_KK", () => {
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

    it("ADD_VX_KK", () => {
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

    it("JP_NNN", () => {
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

    it("DRW_VX_VY_N", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "DRW_VX_VY_N"
      );

      const vx = 5;
      const vy = 1;
      const x = 0;
      const y = 1;
      const n = 5;
      const I = 0x202;
      const opcode = instruction.pattern | (x << 8) | (y << 4) | n;

      cpu.registers[x] = vx;
      cpu.registers[y] = vy;
      cpu.I = I;

      // Load opcode and data to draw number 8.
      // Byte 1 = 0xf0. (1111)
      // Byte 2 = 0x90. (1001)
      // Byte 3 = 0xf0. (1111)
      // Byte 4 = 0x90. (1001)
      // Byte 5 = 0xf0. (1111)
      const data = [opcode, 0xf090, 0xf090, 0xf000];

      cpu.load({ data });
      cpu.step();

      // There is probably a clever way to do this,
      // but I am not trying to be clever right now.

      // Row 1.
      expect(cpu.display[SCREEN_WIDTH * vy + (vx + 0)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * vy + (vx + 1)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * vy + (vx + 2)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * vy + (vx + 3)]).toEqual(1);

      // Row 2.
      expect(cpu.display[SCREEN_WIDTH * (vy + 1) + (vx + 0)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 1) + (vx + 1)]).toEqual(0);
      expect(cpu.display[SCREEN_WIDTH * (vy + 1) + (vx + 2)]).toEqual(0);
      expect(cpu.display[SCREEN_WIDTH * (vy + 1) + (vx + 3)]).toEqual(1);

      // Row 3.
      expect(cpu.display[SCREEN_WIDTH * (vy + 2) + (vx + 0)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 2) + (vx + 1)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 2) + (vx + 2)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 2) + (vx + 3)]).toEqual(1);

      // Row 4.
      expect(cpu.display[SCREEN_WIDTH * (vy + 3) + (vx + 0)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 3) + (vx + 1)]).toEqual(0);
      expect(cpu.display[SCREEN_WIDTH * (vy + 3) + (vx + 2)]).toEqual(0);
      expect(cpu.display[SCREEN_WIDTH * (vy + 3) + (vx + 3)]).toEqual(1);

      // Row 5.
      expect(cpu.display[SCREEN_WIDTH * (vy + 4) + (vx + 0)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 4) + (vx + 1)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 4) + (vx + 2)]).toEqual(1);
      expect(cpu.display[SCREEN_WIDTH * (vy + 4) + (vx + 3)]).toEqual(1);
    });

    it("SE_VX_KK", () => {
      const instruction = instructions.find((instr) => instr.id === "SE_VX_KK");

      const x = 0x2;
      const kk = 0x0022;
      const opcode = instruction.pattern | (x << 8) | kk;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.registers[x] = kk;

      cpu.step();

      expect(cpu.PC).toEqual(0x204);
    });

    it("SNE_VX_KK", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SNE_VX_KK"
      );

      const x = 0x2;
      const kk = 0x0022;
      const opcode = instruction.pattern | (x << 8) | kk;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.registers[x] = kk - 1;

      cpu.step();

      expect(cpu.PC).toEqual(0x204);
    });

    it("SE_VX_VY", () => {
      const instruction = instructions.find((instr) => instr.id === "SE_VX_VY");

      const x = 0x2;
      const y = 0x3;
      const vx = 0x22;
      const vy = 0x22;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.registers[x] = vx;
      cpu.registers[y] = vy;

      cpu.step();

      expect(cpu.PC).toEqual(0x204);
    });

    it("SNE_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SNE_VX_VY"
      );

      const x = 0x2;
      const y = 0x3;
      const vx = 0x22;
      const vy = 0x23;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.registers[x] = vx;
      cpu.registers[y] = vy;

      cpu.step();

      expect(cpu.PC).toEqual(0x204);
    });

    it("CALL_NNN", () => {
      const instruction = instructions.find((instr) => instr.id === "CALL_NNN");

      const nnn = 0x304;

      const opcode = instruction.pattern | nnn;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      const SP = cpu.SP;
      const PC = cpu.PC;

      cpu.step();

      expect(cpu.SP).toEqual(SP + 1);
      expect(cpu.stack[cpu.SP]).toEqual(PC + 2);
      expect(cpu.PC).toEqual(nnn);
    });

    it("RET", () => {
      const instruction = instructions.find((instr) => instr.id === "RET");
      const opcode = instruction.pattern;

      const PC = 0x305;
      const SP = 0;

      cpu.SP = SP;
      cpu.stack[SP] = PC;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.SP).toEqual(SP - 1);
      expect(cpu.PC).toEqual(PC);
    });

    it("LD_VX_VY", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_VX_VY");

      const x = 0x04;
      const y = 0x05;
      const vy = 0x45;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      cpu.registers[y] = vy;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.registers[x]).toEqual(vy);
    });

    it("OR_VX_VY", () => {
      const instruction = instructions.find((instr) => instr.id === "OR_VX_VY");
      const x = 0x05;
      const y = 0x06;
      const vx = 0x1;
      const vy = 0x0;

      const opcode = instruction.pattern | (x << 8) | (y << 4);

      cpu.registers[x] = vx;
      cpu.registers[y] = vy;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.registers[x]).toEqual(vx | vy);
    });

    it("AND_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "AND_VX_VY"
      );
      const x = 0x05;
      const y = 0x06;
      const vx = 0x1;
      const vy = 0x0;

      const opcode = instruction.pattern | (x << 8) | (y << 4);

      cpu.registers[x] = vx;
      cpu.registers[y] = vy;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.registers[x]).toEqual(vx & vy);
    });

    it("XOR_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "XOR_VX_VY"
      );
      const x = 0x05;
      const y = 0x06;
      const vx = 0x1;
      const vy = 0x0;

      const opcode = instruction.pattern | (x << 8) | (y << 4);

      cpu.registers[x] = vx;
      cpu.registers[y] = vy;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.step();

      expect(cpu.registers[x]).toEqual(vx ^ vy);
    });

    describe("ADD_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "ADD_VX_VY"
      );
      const x = 0x2;
      const y = 0x4;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      it("With carry.", () => {
        const vx = 0xdd;
        const vy = 0xde;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual((vx + vy) & 0x00ff);
        expect(cpu.registers[0xf]).toEqual(1);
      });

      it("Without carry.", () => {
        const vx = 0xd;
        const vy = 0xe;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vx + vy);
        expect(cpu.registers[0xf]).toEqual(0);
      });
    });

    describe("SUB_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SUB_VX_VY"
      );
      const x = 0x2;
      const y = 0x4;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      it("With borrow.", () => {
        const vx = 0xde;
        const vy = 0xdd;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vx - vy);
        expect(cpu.registers[0xf]).toEqual(1);
      });

      it("Without borrow.", () => {
        const vx = 0x1;
        const vy = 0x2;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(0xff);
        expect(cpu.registers[0xf]).toEqual(0);
      });
    });

    describe("SHR_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SHR_VX_VY"
      );
      const x = 0x08;
      const y = 0x01;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      it("LSB is 1.", () => {
        const vx = 0x3;

        cpu.registers[x] = vx;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vx >> 1);
        expect(cpu.registers[0xf]).toEqual(1);
      });

      it("LSB is 0.", () => {
        const vx = 0x4;

        cpu.registers[x] = vx;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vx >> 1);
        expect(cpu.registers[0xf]).toEqual(0);
      });
    });

    describe("SHL_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SHL_VX_VY"
      );
      const x = 0x08;
      const y = 0x01;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      it("MSB is 1.", () => {
        const vx = 0xf0;

        cpu.registers[x] = vx;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual((vx << 1) & 0b11100000);
        expect(cpu.registers[0xf]).toEqual(1);
      });

      it("MSB is 0.", () => {
        const vx = 0x3;

        cpu.registers[x] = vx;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vx << 1);
        expect(cpu.registers[0xf]).toEqual(0);
      });
    });

    it("LD_DT_VX", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_DT_VX");

      const x = 0x0;
      const vx = 0x25;
      const opcode = instruction.pattern | (x << 8);

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);

      cpu.registers[x] = vx;

      cpu.step();

      expect(cpu.DT).toEqual(vx);
    });

    it("LD_I_VX", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_I_VX");

      const x = 0x2;
      const opcode = instruction.pattern | (x << 8);

      cpu.I = 0x300;
      cpu.registers[0] = 0x1;
      cpu.registers[1] = 0x2;
      cpu.registers[2] = 0x3;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.step();

      expect(cpu.memory[cpu.I]).toEqual(cpu.registers[0]);
      expect(cpu.memory[cpu.I + 1]).toEqual(cpu.registers[1]);
      expect(cpu.memory[cpu.I + 2]).toEqual(cpu.registers[2]);
    });

    it("LD_VX_I", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_VX_I");

      const x = 0x2;
      const opcode = instruction.pattern | (x << 8);

      cpu.I = 0x300;
      cpu.memory[cpu.I] = 0x1;
      cpu.memory[cpu.I + 1] = 0x2;
      cpu.memory[cpu.I + 2] = 0x3;

      const buffer = {
        data: [opcode],
      };

      cpu.load(buffer);
      cpu.step();

      expect(cpu.registers[0]).toEqual(cpu.memory[cpu.I]);
      expect(cpu.registers[1]).toEqual(cpu.memory[cpu.I + 1]);
      expect(cpu.registers[2]).toEqual(cpu.memory[cpu.I + 2]);
    });

    describe("LD_B_VX", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_B_VX");
      const x = 0x2;
      const opcode = instruction.pattern | (x << 8);

      it("Three digits.", () => {
        const vx = 156;
        cpu.registers[x] = vx;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);
        cpu.step();

        expect(cpu.memory[cpu.I]).toEqual(1);
        expect(cpu.memory[cpu.I + 1]).toEqual(5);
        expect(cpu.memory[cpu.I + 2]).toEqual(6);
      });

      it("Two digits.", () => {
        const vx = 42;
        cpu.registers[x] = vx;

        cpu.memory[cpu.I] = 0x4;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);
        cpu.step();

        expect(cpu.memory[cpu.I]).toEqual(0);
        expect(cpu.memory[cpu.I + 1]).toEqual(4);
        expect(cpu.memory[cpu.I + 2]).toEqual(2);
      });

      it("One digit.", () => {
        const vx = 9;
        cpu.registers[x] = vx;

        cpu.memory[cpu.I] = 0x4;
        cpu.memory[cpu.I + 1] = 0x7;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);
        cpu.step();

        expect(cpu.memory[cpu.I]).toEqual(0);
        expect(cpu.memory[cpu.I + 1]).toEqual(0);
        expect(cpu.memory[cpu.I + 2]).toEqual(9);
      });
    });

    describe("SUBN_VX_VY", () => {
      const instruction = instructions.find(
        (instr) => instr.id === "SUBN_VX_VY"
      );
      const x = 0x2;
      const y = 0x4;
      const opcode = instruction.pattern | (x << 8) | (y << 4);

      it("Without borrow.", () => {
        const vx = 0xde;
        const vy = 0xdd;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(0xff);
        expect(cpu.registers[0xf]).toEqual(0);
      });

      it("With borrow.", () => {
        const vx = 0x1;
        const vy = 0x2;

        cpu.registers[x] = vx;
        cpu.registers[y] = vy;

        const buffer = {
          data: [opcode],
        };

        cpu.load(buffer);

        cpu.step();

        expect(cpu.registers[x]).toEqual(vy - vx);
        expect(cpu.registers[0xf]).toEqual(1);
      });
    });

    it("LD_F_VX", () => {
      const instruction = instructions.find((instr) => instr.id === "LD_F_VX");

      const x = 0x2;
      const opcode = instruction.pattern | (x << 8);

      const buffer = {
        data: [opcode],
      };

      cpu.registers[x] = 0x2;

      cpu.load(buffer);
      cpu.step();

      expect(cpu.I).toEqual(cpu.registers[x] * 5);
    });

    it("ADD_I_VX", () => {
      const instruction = instructions.find((instr) => instr.id === "ADD_I_VX");

      const x = 0x2;
      const opcode = instruction.pattern | (x << 8);

      const buffer = {
        data: [opcode],
      };

      cpu.registers[x] = 0x44;
      const I = cpu.I;

      cpu.load(buffer);
      cpu.step();

      expect(cpu.I).toEqual(cpu.registers[x] + I);
    });
  });

  it("Enables debug mode.", () => {
    cpu.enableDebug();

    expect(cpu.debug).toEqual(true);
  });
});
