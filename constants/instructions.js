const instructions = [
  {
    description: "Clear the screen.",
    mask: 0xffff,
    pattern: 0x00e0,
  },
];

module.exports = {
  instructions,
};
