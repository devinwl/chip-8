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
];

module.exports = {
  instructions,
};
