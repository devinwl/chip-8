const fs = require("fs");

class RomBuffer {
  constructor(filename) {
    this.data = [];

    const buffer = fs.readFileSync(filename);

    // Create 16-bit big endian opcodes from the buffer
    for (let i = 0; i < buffer.length; i += 2) {
      this.data.push((buffer[i] << 8) | (buffer[i + 1] << 0));
    }
  }

  dump() {
    const lines = [];

    for (let i = 0; i < this.data.length; i++) {
      lines.push(this.data[i].toString(16).padStart(4, "0"));
    }

    return lines.join("\n");
  }
}

module.exports = {
  RomBuffer,
};
