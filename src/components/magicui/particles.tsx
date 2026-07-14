import { useEffect, useRef, useState } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  color?: string;
}

export function Particles({
  className,
  quantity = 40,
  color = "#ffffff",
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<any[]>([]);
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const [rgb, setRgb] = useState("255, 255, 255");

  useEffect(() => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 255;
    const g = parseInt(hex.substring(2, 4), 16) || 255;
    const b = parseInt(hex.substring(4, 6), 16) || 255;
    setRgb(`${r}, ${g}, ${b}`);
  }, [color]);

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    let animationFrameId: number;
    
    const animate = () => {
      if (context.current && canvasSize.current.w > 0) {
        context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
        circles.current.forEach((circle: any, i: number) => {
          circle.x += circle.dx;
          circle.y += circle.dy;

          if (circle.alpha < circle.targetAlpha) {
            circle.alpha += 0.01;
          }

          // check bounds
          if (
            circle.x < -circle.size ||
            circle.x > canvasSize.current.w + circle.size ||
            circle.y < -circle.size ||
            circle.y > canvasSize.current.h + circle.size
          ) {
            // recreate
            circles.current[i] = circleParams();
          }

          if (context.current) {
            context.current.beginPath();
            context.current.arc(circle.x, circle.y, circle.size, 0, 2 * Math.PI);
            context.current.fillStyle = `rgba(${rgb}, ${circle.alpha})`;
            context.current.fill();
          }
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [rgb]);

  const initCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current = [];
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w;
      canvasRef.current.height = canvasSize.current.h;
      
      for (let i = 0; i < quantity; i++) {
        circles.current.push(circleParams());
      }
    }
  };

  const circleParams = () => {
    const x = Math.random() * canvasSize.current.w;
    const y = Math.random() * canvasSize.current.h;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = 0;
    const targetAlpha = Math.random() * 0.4 + 0.1;
    const dx = (Math.random() - 0.5) * 0.15;
    const dy = (Math.random() - 0.5) * 0.15;
    return {
      x,
      y,
      size,
      alpha,
      targetAlpha,
      dx,
      dy,
    };
  };

  return (
    <div
      className={className}
      ref={canvasContainerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
