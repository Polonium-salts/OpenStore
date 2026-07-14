import { cn } from "@/lib/utils";
import React from "react";

interface ShineBorderProps {
  className?: string;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string;
}

export function ShineBorder({
  className,
  borderRadius = 8,
  borderWidth = 1,
  duration = 8,
  color = "linear-gradient(90deg, #0078d4, #9c40ff, #0078d4)",
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--shine-color": color,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[var(--border-radius)] [border:var(--border-width)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:inset-0 after:rounded-[var(--border-radius)] after:animate-shine after:bg-[var(--shine-color)] after:bg-[length:200%_auto]",
        className,
      )}
    />
  );
}
