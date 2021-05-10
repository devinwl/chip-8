const { CPU } = require("./classes/CPU");
const { RomBuffer } = require("./classes/RomBuffer");

const buffer = new RomBuffer("./roms/BC_test.ch8");
const cpu = new CPU();

cpu.load(buffer);
cpu.enableDebug();

// CPU Loop.
for (;;) {
  cpu.step();
  cpu.dumpDisplay();
}
