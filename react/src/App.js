import { useEffect, useRef, useState } from "react";
import { CPU } from "./chip-8/classes/CPU";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./chip-8/constants/CPU.constant";

const cpu = new CPU();

function App() {
  const canvasRef = useRef(null);
  const [registers, setRegisters] = useState(Array(16));
  const [instructions, setInstructions] = useState(Array(16));

  const drawPixel = (x, y) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "#000000";
    context.fillRect(x, y, 1, 1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawCanvas = () => {
    for (let i = 0; i < SCREEN_HEIGHT; i++) {
      for (let j = 0; j < SCREEN_WIDTH; j++) {
        if (cpu.display[i * SCREEN_WIDTH + j]) {
          drawPixel(j, i);
        }
      }
    }
  };

  const handleClick = () => {
    cpu.step();
    drawCanvas();
    setRegisters(Array.from(cpu.registers));
  };

  useEffect(() => {
    clearCanvas();
    drawCanvas();
  }, []);

  useEffect(() => {
    const buffer = {
      data: [
        0x00e0,
        0xa22a,
        0x600c,
        0x6108,
        0xd01f,
        0x7009,
        0xa239,
        0xd01f,
        0xa248,
        0x7008,
        0xd01f,
        0x7004,
        0xa257,
        0xd01f,
        0x7008,
        0xa266,
        0xd01f,
        0x7008,
        0xa275,
        0xd01f,
        0x1228,
        0xff00,
        0xff00,
        0x3c00,
        0x3c00,
        0x3c00,
        0x3c00,
        0xff00,
        0xffff,
        0x00ff,
        0x0038,
        0x003f,
        0x003f,
        0x0038,
        0x00ff,
        0x00ff,
        0x8000,
        0xe000,
        0xe000,
        0x8000,
        0x8000,
        0xe000,
        0xe000,
        0x80f8,
        0x00fc,
        0x003e,
        0x003f,
        0x003b,
        0x0039,
        0x00f8,
        0x00f8,
        0x0300,
        0x0700,
        0x0f00,
        0xbf00,
        0xfb00,
        0xf300,
        0xe300,
        0x43e0,
        0x00e0,
        0x0080,
        0x0080,
        0x0080,
        0x0080,
        0x00e0,
        0x00e0,
      ],
    };

    cpu.load(buffer);
  }, []);

  return (
    <div className="App">
      <canvas
        ref={canvasRef}
        width="64"
        height="32"
        style={{ width: "100%" }}
      />
      <button onClick={() => handleClick()}>Step</button>
      {registers.map((value, id) => {
        return (
          <div key={id}>
            V{id.toString(16)} = {value}
          </div>
        );
      })}
    </div>
  );
}

export default App;
