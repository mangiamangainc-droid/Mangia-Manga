"use client";
import { useState, useRef, useEffect } from "react";

interface ImagePositionPickerProps {
  imageURL: string;
  aspectRatio: "square" | "banner";
  onSave: (position: { x: number; y: number }) => void;
  onCancel: () => void;
  currentPosition?: { x: number; y: number };
}

export function ImagePositionPicker({
  imageURL,
  aspectRatio,
  onSave,
  onCancel,
  currentPosition = { x: 50, y: 50 },
}: ImagePositionPickerProps) {
  const [position, setPosition] = useState(currentPosition);
  const imageAreaRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  // Click or drag anywhere on the image to set the focal point
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    updatePosition(e);
  };

  const updatePosition = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageAreaRef.current) return;
    const rect = imageAreaRef.current.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    setPosition({ x, y });
  };

  // Preview dimensions
  const previewW = aspectRatio === "square" ? 120 : 320;
  const previewH = aspectRatio === "square" ? 120 : 80;
  const previewRadius = aspectRatio === "square" ? "50%" : "10px";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginBottom: "4px" }}>
          Choose Focus Point
        </div>
        <div style={{ color: "#666", fontSize: "0.82rem" }}>
          Click or drag anywhere on the image to set the focal point
        </div>
      </div>

      {/* Full image with focal point marker */}
      <div
        ref={imageAreaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          position: "relative",
          maxWidth: "min(800px, 90vw)",
          maxHeight: "50vh",
          cursor: "crosshair",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #2a2a2a",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {/* Full image — nothing cut */}
        <img
          src={imageURL}
          draggable={false}
          alt="Pick focus"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            maxHeight: "50vh",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />

        {/* Focal point marker */}
        <div
          style={{
            position: "absolute",
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: "translate(-50%, -50%)",
            width: "28px",
            height: "28px",
            pointerEvents: "none",
          }}
        >
          {/* Outer ring */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "2px solid #01FF48",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 0 8px rgba(1,255,72,0.5)",
          }} />
          {/* Inner dot */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "6px", height: "6px",
            borderRadius: "50%",
            background: "#01FF48",
            boxShadow: "0 0 4px rgba(1,255,72,0.8)",
          }} />
          {/* Crosshair lines */}
          <div style={{ position: "absolute", left: "50%", top: "-10px", bottom: "-10px", width: "1px", background: "rgba(1,255,72,0.6)", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "-10px", right: "-10px", height: "1px", background: "rgba(1,255,72,0.6)", transform: "translateY(-50%)" }} />
        </div>
      </div>

      {/* Live preview */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <div style={{ color: "#555", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Preview
        </div>
        <div style={{
          width: `${previewW}px`,
          height: `${previewH}px`,
          borderRadius: previewRadius,
          overflow: "hidden",
          border: "2px solid #01FF48",
          boxShadow: "0 0 20px rgba(1,255,72,0.2)",
          flexShrink: 0,
        }}>
          <img
            src={imageURL}
            draggable={false}
            alt="Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${position.x}% ${position.y}%`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => setPosition({ x: 50, y: 50 })}
          style={{
            background: "none", border: "1px solid #2a2a2a",
            color: "#555", padding: "10px 18px",
            borderRadius: "8px", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.85rem",
          }}
        >
          Reset
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "1px solid #333",
            color: "#888", padding: "10px 22px",
            borderRadius: "8px", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.9rem",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(position)}
          style={{
            background: "#01FF48", border: "none",
            color: "#000", padding: "10px 28px",
            borderRadius: "8px", fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        >
          Save Position
        </button>
      </div>
    </div>
  );
}
