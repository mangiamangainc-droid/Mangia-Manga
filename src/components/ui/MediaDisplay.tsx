"use client";

interface MediaDisplayProps {
  url: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  position?: { x: number; y: number };
}

export function MediaDisplay({ url, alt, className, style, position }: MediaDisplayProps) {
  if (!url) return null;

  const isVideo = url.includes("/video/") || 
    url.endsWith(".mp4") || 
    url.endsWith(".webm") || 
    url.endsWith(".mov");

  const combinedStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: position ? `${position.x}% ${position.y}%` : "center",
    ...style
  };

  if (isVideo) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        style={combinedStyle}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt || ""}
      className={className}
      style={combinedStyle}
    />
  );
}

