'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';

const COLORS = [
  '#FF0000', '#FF6B6B', '#FFA500', '#FFD700',
  '#00FF00', '#4ECDC4', '#00CED1', '#0000FF',
  '#8B5CF6', '#FF69B4', '#000000', '#FFFFFF',
];

const BRUSH_SIZES = [5, 15, 30];
const STAMPS = ['⭐', '🌈', '🦋', '🌸', '❤️', '☀️', '🍀', '🎈'];

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setLastPos(pos);

    if (selectedStamp) {
      drawStamp(pos.x, pos.y);
    } else {
      setIsDrawing(true);
      draw(e);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && !selectedStamp) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getPos(e);

    if (selectedStamp) {
      // Stamp mode - handled in startDrawing
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawStamp = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedStamp) return;

    ctx.font = `${brushSize * 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedStamp, x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'my-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  // Initialize canvas
  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <GameLayout title="Drawing Canvas" emoji="🎨" showScore={false}>
      <div className="flex flex-col items-center">
        {/* Color Picker */}
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {COLORS.map(c => (
            <motion.button
              key={c}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
                setSelectedStamp(null);
              }}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c && !isEraser && !selectedStamp ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush Sizes */}
        <div className="mb-3 flex gap-2">
          {BRUSH_SIZES.map(size => (
            <motion.button
              key={size}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setBrushSize(size);
                setSelectedStamp(null);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                brushSize === size && !selectedStamp ? 'bg-purple-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: size, height: size }}
              />
            </motion.button>
          ))}
        </div>

        {/* Stamps */}
        <div className="mb-3 flex gap-2">
          {STAMPS.map(stamp => (
            <motion.button
              key={stamp}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSelectedStamp(stamp);
                setIsEraser(false);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                selectedStamp === stamp ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              {stamp}
            </motion.button>
          ))}
        </div>

        {/* Canvas */}
        <canvas
          ref={(el) => {
            if (el) {
              canvasRef.current = el;
              if (!el.dataset.initialized) {
                initCanvas(el);
                el.dataset.initialized = 'true';
              }
            }
          }}
          width={320}
          height={350}
          className="rounded-2xl border-4 border-white shadow-lg cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Tools */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsEraser(!isEraser);
              setSelectedStamp(null);
            }}
            className={`px-4 py-2 rounded-full font-bold ${
              isEraser ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'
            }`}
          >
            🧽 Eraser
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCanvas}
            className="px-4 py-2 rounded-full font-bold bg-red-500 text-white"
          >
            🗑️ Clear
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadDrawing}
            className="px-4 py-2 rounded-full font-bold bg-green-500 text-white"
          >
            📥 Save
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Draw with colors, use stamps, and save your art!</p>
          <p>Tap a stamp then tap the canvas to place it!</p>
        </div>
      </div>
    </GameLayout>
  );
}
