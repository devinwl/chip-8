# chip-8

A CHIP-8 interpreter written in JavaScript.

ROMs are stored in the `/roms` folder.

# Setup

```
$ npm install
$ npm start
```

# DevLog

Keeping track of changes and thought processes as we go.

## 05/20/2020

- Basic CPU class finished. Can load a ROM into memory and load instructions. Does not actually execute any instructions yet. Have a custom error class for CPU errors.
- ROM loader (RomBuffer) class finished. Will read a ROM and convert it into big-endian format for the CPU to load into memory.
- Starting an instruction set in `/constants/instructions.js`. The rough structure is something like an array of objects with `description`, `mask`, and `pattern`. The `mask` helps break opcodes into matchable patterns. The `pattern` is used to match an opcode structure. The `mask` will help strip out arguments to make matching possible with just bitwise operators.

TODO:

- Add a better error generating mechanism. Don't like having to manually throw when I want to use some helper functions to debug. Maybe something like `throwError()`?
- Determine some kind of testing structure. Want to make sure the CPU is responding to instructions and such as expected. Will need to read memory at arbitrary location, so some helper methods would be nice. Might be easier to have the CPU do a few instructions first.
- Make the CPU execute something, duh.
