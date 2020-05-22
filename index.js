const { CPU } = require("./classes/CPU");
const { RomBuffer } = require("./classes/RomBuffer");

const buffer = new RomBuffer("./roms/ibm.ch8");
const cpu = new CPU();

cpu.load(buffer);

// CPU Loop.
for (;;) {
  cpu.debug();
  cpu.step();
}
