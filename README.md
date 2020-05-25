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

## 05/24/2020

- Draw instruction pretty tricky. Needed to read up on how the display works. Turns out every sprite is 8 bits wide. They are typically 5 bytes long, but can be up to 15. Tinkered with an implementation that used one byte to represent 8 bits (or pixels) of the screen. This seemed great at first until I realized that I might have to "split" the byte depending on where the sprite was being written. For example, bit 12 is in between bytes 1 and 2 (0 indexed). So I would have to chop off the bits from my sprite for both byte 1 and 2. But if I ended up writing to say bit 8, then I'd only need one byte. The logic was confusing and weird. I scrapped it.
- Decided to go with a straight array of 0 and 1 for the display. It's a 64 x 32 array and uses a bit of math to find the pixel to write to. It's like a giant row of 2048 pixels, but if you break it down by 64 pixels each, you get a nice 64 x 32 display!
- Added more instructions. I have one working ROM so far!
- Turns out it's possible to create an infinite loop with a `JP` instruction. Debating if I should add a custom stack buffer to make sure this doesn't happen?

TODO

- Write tests for RomBuffer.
- Implement CLS instruction.
- Support the Vf flag (pixel collisions) in DRW instruction.
- Write instructions.

## 05/23/2020

- Added `jest` library for tests. Added the initial tests for the CPU class.
- Fixed a nasty recursion bug when throwing an error while the PC was out-of-bounds. Wouldn't have found it without writing a test first!
- Changed `debug()` up a little.

TODO:

- Mo' tests mo' instructions.

## 05/22/2020

- Added first few instructions. Refactored the instruction set slightly so it's possible to dynamically determine the argument values as needed.
- Added a preliminary implementation for the display. Since a pixel is either off or on, booleans seem sufficient for now.
- Added a `throw()` function for throwing errors. I'm happy with this implementation. As I develop, it's helpful in determining what instructions I need to implement next, or catching errors during execution implementation.
- I decided to add a helper function `debug()` to help make debugging a little easier. As a side-note, when I implemented this function it felt really good to create it with the current level of abstraction going on in the CPU class. It didn't feel hacky or anything. Nice.

TODO:

- Continue implementing execution code for instructions.
- Determine testing style. Thinking jest would be quick?

## 05/20/2020

- Basic CPU class finished. Can load a ROM into memory and load instructions. Does not actually execute any instructions yet. Have a custom error class for CPU errors.
- ROM loader (RomBuffer) class finished. Will read a ROM and convert it into big-endian format for the CPU to load into memory.
- Starting an instruction set in `/constants/instructions.js`. The rough structure is something like an array of objects with `description`, `mask`, and `pattern`. The `mask` helps break opcodes into matchable patterns. The `pattern` is used to match an opcode structure. The `mask` will help strip out arguments to make matching possible with just bitwise operators.

TODO:

- Add a better error generating mechanism. Don't like having to manually throw when I want to use some helper functions to debug. Maybe something like `throwError()`?
- Determine some kind of testing structure. Want to make sure the CPU is responding to instructions and such as expected. Will need to read memory at arbitrary location, so some helper methods would be nice. Might be easier to have the CPU do a few instructions first.
- Make the CPU execute something, duh.
