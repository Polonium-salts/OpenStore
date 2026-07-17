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
  }

  const srcUrl = fallbackUrl || defaultIcon;

  return (
    <img
      src={srcUrl}
      alt={title || "App Icon"}
      className={className}
      onError={(e) => {
        // Fallback if the URL fails to load
        (e.target as HTMLImageElement).src = defaultIcon;
      }}
    />
  );
}
