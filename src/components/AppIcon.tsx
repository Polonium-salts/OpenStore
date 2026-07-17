import { cn } from "@/lib/utils";

export default function AppIcon({
  platform,
  fallbackUrl,
  title,
  className,
}: {
  platform?: string;
  fallbackUrl?: string;
  title: string;
  className?: string;
}) {
  let defaultIcon = "https://github.com/github.png";
  if (platform === "gitee") {
    defaultIcon = "https://gitee.com/logo-black.svg";
  } else if (platform === "zip" || platform === "url_source") {
    defaultIcon = ""; // Will trigger the letter block
  }

  const srcUrl = fallbackUrl || defaultIcon;

  if (!srcUrl) {
    // Generate a premium gradient background based on the title string hash
    let hash = 0;
    const cleanTitle = title || "App";
    for (let i = 0; i < cleanTitle.length; i++) {
      hash = cleanTitle.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const bgStyle = {
      background: `linear-gradient(135deg, hsl(${hue}, 65%, 42%), hsl(${(hue + 45) % 360}, 70%, 32%))`,
    };
    const firstLetter = cleanTitle.trim().charAt(0).toUpperCase();

    return (
      <div
        className={cn(
          "flex items-center justify-center text-white font-black text-sm select-none shadow-inner border border-white/10",
          className
        )}
        style={bgStyle}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={srcUrl}
      alt={title || "App Icon"}
      className={className}
      onError={(e) => {
        // Fallback to text block if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          const div = document.createElement("div");
          div.className = className || "";
          let hash = 0;
          const cleanTitle = title || "App";
          for (let i = 0; i < cleanTitle.length; i++) {
            hash = cleanTitle.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash) % 360;
          div.style.background = `linear-gradient(135deg, hsl(${hue}, 65%, 42%), hsl(${(hue + 45) % 360}, 70%, 32%))`;
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.justifyContent = "center";
          div.style.color = "white";
          div.style.fontWeight = "900";
          div.style.fontSize = "14px";
          div.style.userSelect = "none";
          div.style.border = "1px solid rgba(255,255,255,0.1)";
          div.innerText = cleanTitle.trim().charAt(0).toUpperCase();
          parent.appendChild(div);
        }
      }}
    />
  );
}
