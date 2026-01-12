'use client';

import { useEffect, useRef } from 'react';

export default function HexagonalMapPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Hexagonal dot pattern parameters
    const dotRadius = 3;
    const spacing = 10;
    const dotColor = '#FFFFFF';  // White dots
    const dotOpacity = 1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hexagonal grid pattern
    for (let row = 0; row < Math.ceil(canvas.height / spacing) + 1; row++) {
      for (let col = 0; col < Math.ceil(canvas.width / spacing) + 1; col++) {
        const x = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
        const y = row * spacing * 0.866; // 0.866 = sqrt(3)/2 for hexagonal spacing

        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `${dotColor}${Math.round(dotOpacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    }

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < Math.ceil(canvas.height / spacing) + 1; row++) {
        for (let col = 0; col < Math.ceil(canvas.width / spacing) + 1; col++) {
          const x = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
          const y = row * spacing * 0.866;

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `${dotColor}${Math.round(dotOpacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
        opacity: 0.5
      }}
    />
  );
}
