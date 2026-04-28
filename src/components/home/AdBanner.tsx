"use client";

import { useEffect, useState } from "react";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, BookOpen } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function AdBanner() {
  const [adBanner, setAdBanner] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "adBanner"), (snap) => {
      if (snap.exists()) setAdBanner(snap.data());
    }, (err) => {
      console.error("Error fetching ad banner:", err);
    });
    return () => unsub();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div style={{
        margin: "16px",
        borderRadius: "16px",
        overflow: "hidden",
        minHeight: "160px",
        position: "relative",
        background: adBanner?.bgColor || "#01FF48",
      }}>
        {/* Background image - full cover */}
        {adBanner?.imageURL && (
          <MediaDisplay
            url={adBanner.imageURL}
            alt="Ad Banner"
            position={adBanner.imagePosition}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Gradient from left (text area) to transparent */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg,
            ${adBanner?.bgColor || "#01FF48"} 0%,
            ${adBanner?.bgColor || "#01FF48"}ee 35%,
            ${adBanner?.bgColor || "#01FF48"}88 55%,
            transparent 75%
          )`,
        }} />

        {/* Text */}
        <div style={{
          position: "relative",
          zIndex: 2,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}>
          <div style={{ marginBottom: "auto" }}>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: adBanner?.textColor || "#000", marginBottom: "4px" }}>
              {adBanner?.titleEN || "Subscribe Now!"}
            </div>
            <div style={{ fontSize: "0.8rem", color: adBanner?.textColor || "#000", opacity: 0.85 }}>
              {adBanner?.descEN || ""}
            </div>
          </div>
          <div style={{ display: "none" }}>DEBUG: {JSON.stringify(adBanner?.buttons)}</div>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center", justifyContent: "flex-start" }}>
            {(adBanner?.buttons || []).map((btn: any) => (
              <button
                key={btn.id}
                onClick={() => router.push(btn.href)}
                style={{
                  background: btn.style === "text" || btn.style === "outline" ? "transparent" : btn.color,
                  color: btn.style === "text" ? btn.color : btn.textColor,
                  border: btn.style === "outline" ? `2px solid ${btn.color}` : "none",
                  padding: btn.style === "text" ? "6px 2px" : "10px 24px",
                  borderRadius: btn.style === "rounded" ? "50px" : btn.style === "filled" ? "8px" : btn.style === "outline" ? "8px" : "6px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontFamily: "inherit",
                  textDecoration: btn.style === "text" ? "underline" : "none",
                  transition: "all 0.3s ease",
                  opacity: 1,
                  boxShadow: btn.style === "filled" ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (btn.style === "filled") {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
                  } else if (btn.style === "outline") {
                    e.currentTarget.style.background = btn.color + "15";
                  }
                }}
                onMouseLeave={(e) => {
                  if (btn.style === "filled") {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                  } else if (btn.style === "outline") {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {btn.labelEN}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
