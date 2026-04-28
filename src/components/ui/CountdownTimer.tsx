"use client";
import { useEffect, useState } from "react";
import { Sparkles, Play } from "lucide-react";

interface CountdownTimerProps {
  launchAt: Date;
  onLaunched?: () => void;
  onClick?: () => void;
}

export function CountdownTimer({ launchAt, onLaunched, onClick }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = launchAt.getTime() - now.getTime();

      if (diff <= 0) {
        setLaunched(true);
        onLaunched?.();
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [launchAt, onLaunched]);

  if (launched) {
    return (
      <button 
        onClick={onClick}
        className="group/btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "#01FF48",
          color: "#000",
          border: "none",
          cursor: "pointer",
          borderRadius: "100px",
          padding: "12px 32px",
          marginTop: "16px",
          boxShadow: "0 4px 15px rgba(1, 255, 72, 0.3)",
          transition: "all 0.3s ease",
        }}
      >
        <Play className="w-4 h-4 fill-black text-black" />
        <span style={{ color: "#000", fontWeight: 900, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          It&apos;s Live! Read Now
        </span>
      </button>
    );
  }

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "flex-start" }}>
      {blocks.map((block, i) => (
        <div key={block.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "30px",
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.5px" }}>
              {String(block.value).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#888", marginTop: "4px", fontWeight: 500 }}>
              {block.label}
            </div>
          </div>
          {i < blocks.length - 1 && (
            <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#FFFFFF", lineHeight: 1, position: "relative", top: "-2px" }}>
              :
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
