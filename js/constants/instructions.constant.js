// Instructions structure:
// ---
// id: A unique identifier for the instruction.
// description: A human-readable description of what the instruction does.
// mask: A bitwise mask (using &) to apply to determine if the instruction matches the given pattern.
// pattern: The pattern to match when using the `mask`.
// arguments: An array of arguments to get from the opcode.
// ---
// Arguments structure:
// id: A unique identifier for the argument. Used during execution step.
// mask: A bitwise mask (using &) to "grab" the argument value from the opcode.
// shift: How many bytes are needed to bitwise shift to read the value.
// ---

const instructions = [
  {
    id: "CLS",
    description: "Clear the screen.",
    instruction: "CLS",
    mask: 0xffff,
    pattern: 0x00e0,
    arguments: [],
  },
  {
    id: "LD_I_NNN",
    description: "Load address nnn into register I.",
    instruction: "LD I,nnn",
    mask: 0xf000,
    pattern: 0xa000,
    arguments: [
      {
        id: "nnn",
        mask: 0x0fff,
        shift: 0,
      },
    ],
  },
  {
    id: "LD_VX_KK",
    description: "Load value KK into register Vx.",
    instruction: "LD Vx,kk",
    mask: 0xf000,
    pattern: 0x6000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "kk",
        mask: 0x00ff,
        shift: 0,
      },
    ],
  },
  {
    id: "DRW_VX_VY_N",
    description:
      "Draw n-byte sprite starting at memory location I and start rendering at (Vx, Vy).",
    instruction: "DRW Vx,Vy,n",
    mask: 0xf000,
    pattern: 0xd000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
      {
        id: "n",
        mask: 0x000f,
        shift: 0,
      },
    ],
  },
  {
    id: "ADD_VX_KK",
    description:
      "Adds KK to the value stored in Vx, then stores the result in Vx.",
    instruction: "ADD Vx,kk",
    mask: 0xf000,
    pattern: 0x7000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "kk",
        mask: 0x00ff,
        shift: 0,
      },
    ],
  },
  {
    id: "JP_NNN",
    description: "Jump to address nnn.",
    instruction: "JP nnn",
    mask: 0xf000,
    pattern: 0x1000,
    arguments: [
      {
        id: "nnn",
        mask: 0x0fff,
        shift: 0,
      },
    ],
  },
  {
    id: "SE_VX_KK",
    description: "Skip next instruction if register Vx = kk.",
    instruction: "SE Vx,kk",
    mask: 0xf000,
    pattern: 0x3000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "kk",
        mask: 0x00ff,
        shift: 0,
      },
    ],
  },
  {
    id: "SNE_VX_KK",
    description: "Skip next instruction if register Vx != kk.",
    instruction: "SNE Vx,kk",
    mask: 0xf000,
    pattern: 0x4000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "kk",
        mask: 0x00ff,
        shift: 0,
      },
    ],
  },
  {
    id: "SE_VX_VY",
    description: "Skip next instruction if register Vx = register Vy.",
    instruction: "SE Vx,Vy",
    mask: 0xf00f,
    pattern: 0x5000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "SNE_VX_VY",
    description: "Skip next instruction if register Vx != register Vy.",
    instruction: "SNE Vx,Vy",
    mask: 0xf000,
    pattern: 0x9000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "CALL_NNN",
    description: "Call subroutine at nnn.",
    instruction: "CALL nnn",
    mask: 0xf000,
    pattern: 0x2000,
    arguments: [
      {
        id: "nnn",
        mask: 0x0fff,
        shift: 0,
      },
    ],
  },
  {
    id: "RET",
    description: "Return from subroutine.",
    instruction: "RET",
    mask: 0xffff,
    pattern: 0x00ee,
    arguments: [],
  },
  {
    id: "LD_VX_VY",
    description: "Set register Vx = register Vy.",
    instruction: "LD Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8000,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "OR_VX_VY",
    description: "Set Vx = Vx OR Vy.",
    instruction: "OR Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8001,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "AND_VX_VY",
    description: "Set Vx = Vx AND Vy.",
    instruction: "AND Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8002,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "XOR_VX_VY",
    description: "Set Vx = Vx XOR Vy.",
    instruction: "XOR Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8003,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "ADD_VX_VY",
    description: "Set Vx = Vx + Vy. Set Vf = carry.",
    instruction: "ADD Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8004,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "SUB_VX_VY",
    description: "Set Vx = Vx - Vy. Set Vf = NOT borrow.",
    instruction: "SUB Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8005,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "SHR_VX_VY",
    description: "Set Vx = Vx SHR 1. If LSB is 1, set Vf = 1.",
    instruction: "SHR Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8006,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "SHL_VX_VY",
    description: "Set Vx = Vx SHL 1. If MSB is 1, set Vf = 1.",
    instruction: "SHL Vx,Vy",
    mask: 0xf00f,
    pattern: 0x800e,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "LD_DT_VX",
    description: "Set DT = Vx.",
    instruction: "LD DT,Vx",
    mask: 0xf0ff,
    pattern: 0xf015,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
  {
    id: "LD_I_VX",
    description:
      "Load registers V0 through Vx into memory starting at location I.",
    instruction: "LD [I],Vx",
    mask: 0xf0ff,
    pattern: 0xf055,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
  {
    id: "LD_VX_I",
    description: "Reads memory starting at I into V0 through Vx.",
    instruction: "LD Vx,[I]",
    mask: 0xf0ff,
    pattern: 0xf065,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
  {
    id: "LD_B_VX",
    description: "TODO",
    instruction: "LD B,Vx",
    mask: 0xf0ff,
    pattern: 0xf033,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
  {
    id: "SUBN_VX_VY",
    description: "Set Vx = Vy - Vx. Set Vf = NOT borrow.",
    instruction: "SUBN Vx,Vy",
    mask: 0xf00f,
    pattern: 0x8007,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
      {
        id: "y",
        mask: 0x00f0,
        shift: 4,
      },
    ],
  },
  {
    id: "LD_F_VX",
    description: "TODO",
    instruction: "LD F,Vx",
    mask: 0xf0ff,
    pattern: 0xf029,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
  {
    id: "ADD_I_VX",
    description: "Sets I = I + register Vx.",
    instruction: "ADD I,Vx",
    mask: 0xf0ff,
    pattern: 0xf01e,
    arguments: [
      {
        id: "x",
        mask: 0x0f00,
        shift: 8,
      },
    ],
  },
];

module.exports = {
  instructions,
};
