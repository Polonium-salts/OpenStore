import { cn } from "@/lib/utils";
import React from "react";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "group relative inline-flex h-10 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#0078d4,#9c40ff,#00c6ff,#0078d4)] bg-[length:200%_auto] px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-[position:right_center] active:scale-95 cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950",
        className,
      )}
    >
      {children}
    </button>
  );
}
