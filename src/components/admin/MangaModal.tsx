"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ImagePositionPicker } from "@/components/ui/ImagePositionPicker";
import { Collections } from "@/lib/firebase/firestore";
import { Manga, MangaGenre } from "@/types";
import toast from "react-hot-toast";

const mangaSchema = z.object({
  nameEn: z.string().min(2, "Required"),
  nameAr: z.string().min(2, "Required"),
  descriptionEn: z.string().min(10, "Required"),
  descriptionAr: z.string().min(10, "Required"),
  status: z.enum(["ongoing", "completed", "hiatus"]),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

type MangaFormValues = z.infer<typeof mangaSchema>;

interface MangaModalProps {
  isOpen: boolean;
  onClose: () => void;
  manga?: Manga | null;
}

const GENRES: MangaGenre[] = [
  "action", "adventure", "comedy", "drama", "fantasy",
  "horror", "mystery", "romance", "sci-fi", "slice-of-life",
  "supernatural", "thriller", "sports",
];

export function MangaModal({ isOpen, onClose, manga }: MangaModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [bannerURL, setBannerURL] = useState<string | null>(null);
  const [posterURL, setPosterURL] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const [bannerPosition, setBannerPosition] = useState({ x: 50, y: 50 });
  const [posterPosition, setPosterPosition] = useState({ x: 50, y: 50 });
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MangaFormValues>({
    resolver: zodResolver(mangaSchema),
    defaultValues: {
      nameEn: "", nameAr: "",
      descriptionEn: "", descriptionAr: "",
      status: "ongoing", genres: [],
      isFeatured: false, isPublished: true,
    },
  });

  const selectedGenres = watch("genres") || [];

  useEffect(() => {
    if (manga && isOpen) {
      reset({
        nameEn: manga.nameEn, nameAr: manga.nameAr,
        descriptionEn: manga.descriptionEn, descriptionAr: manga.descriptionAr,
        status: manga.status, genres: manga.genres,
        isFeatured: manga.isFeatured, isPublished: manga.isPublished,
      });
      setBannerURL(manga.bannerURL ?? null);
      setPosterURL(manga.posterURL ?? null);
      setBannerPosition(manga.bannerPosition ?? { x: 50, y: 50 });
      setPosterPosition(manga.posterPosition ?? { x: 50, y: 50 });
    } else if (isOpen) {
      reset({ nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", status: "ongoing", genres: [], isFeatured: false, isPublished: true });
      setBannerURL(null); setPosterURL(null);
      setBannerPosition({ x: 50, y: 50 }); setPosterPosition({ x: 50, y: 50 });
    }
  }, [manga, reset, isOpen]);

  const handleBannerSelect = async (file: File) => {
    setBannerUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/banners");
      setBannerURL(url);
      setShowBannerPicker(true);
      toast.success("Banner uploaded!");
    } catch (err) { toast.error("Banner upload failed!"); }
    setBannerUploading(false);
  };

  const handlePosterSelect = async (file: File) => {
    setPosterUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/posters");
      setPosterURL(url);
      setShowPosterPicker(true);
      toast.success("Poster uploaded!");
    } catch (err) { toast.error("Poster upload failed!"); }
    setPosterUploading(false);
  };

  const onSubmit = async (data: MangaFormValues) => {
    const isEditing = Boolean(manga?.id);
    
    if (!isEditing && (!bannerURL || !posterURL)) {
      toast.error("Please upload both banner and poster images");
      return;
    }

    setLoading(true);
    try {
      const mangaData = {
        ...data, 
        bannerURL: bannerURL || "", 
        bannerPosition: bannerPosition,
        posterURL: posterURL || "",
        posterPosition: posterPosition,
        updatedAt: Timestamp.now(),
        totalViews: manga?.totalViews ?? 0,
        totalRatings: manga?.totalRatings ?? 0,
        averageRating: manga?.averageRating ?? 0,
        totalSeasons: manga?.totalSeasons ?? 0,
        totalChapters: manga?.totalChapters ?? 0,
      };

      if (isEditing && manga!.id) {
        await updateDoc(doc(db, Collections.MANGA, manga!.id), mangaData);
        toast.success("Manga updated!");
      } else {
        await addDoc(collection(db, Collections.MANGA), { ...mangaData, createdAt: Timestamp.now() });
        toast.success("Manga created!");
      }
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save manga");
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    const current = selectedGenres ?? [];
    setValue("genres", current.includes(genre) ? current.filter(g => g !== genre) : [...current, genre]);
  };

  if (!isOpen) return null;

  /* ── Shared micro-styles ── */
  const S = {
    label: {
      fontSize: "0.7rem", color: "#777", display: "block",
      marginBottom: "3px", textTransform: "uppercase" as const,
      letterSpacing: "0.07em", fontWeight: 700,
    },
    input: {
      width: "100%", background: "#181818", border: "1px solid #2a2a2a",
      color: "#fff", padding: "6px 10px", borderRadius: "7px",
      fontSize: "0.82rem", boxSizing: "border-box" as const, outline: "none",
    },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
    err: { color: "#f87171", fontSize: "0.65rem", marginTop: "2px" },
  };

  return (
    /* ── Overlay ── */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      {/* ── Modal box ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#111", border: "1px solid #2a2a2a", borderRadius: "14px",
          width: "100%", maxWidth: "600px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >

        {/* HEADER — ~48px */}
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #222",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
              {manga ? "Edit Manga" : "Create New Manga"}
            </h2>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Administrator Control
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: "1.3rem", cursor: "pointer", padding: "2px 6px" }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* ── Images row — ~70px ── */}
          <div style={S.row}>
            {/* Banner */}
            <div>
              <label style={S.label}>Banner (1920×600)</label>
              <div
                onClick={() => document.getElementById("banner-input")?.click()}
                style={{
                  height: "60px", border: "1px dashed #333", borderRadius: "7px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", background: "#0d0d0d",
                  position: "relative",
                }}
              >
                {bannerUploading ? (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "4px",
                  }}>
                    <div style={{
                      width: "16px", height: "16px",
                      border: "2px solid #333",
                      borderTop: "2px solid #01FF48",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                    <span style={{ fontSize: "0.6rem", color: "#888" }}>Uploading...</span>
                  </div>
                ) : bannerURL ? (
                  <img 
                    src={bannerURL} 
                    style={{ 
                      width: "100%", height: "100%", objectFit: "cover",
                      objectPosition: `${bannerPosition.x}% ${bannerPosition.y}%`
                    }} 
                    alt="" 
                  />
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "#444" }}>Click to upload</span>
                )}
              </div>
              <input 
                id="banner-input"
                type="file" 
                accept="image/*,image/gif" 
                style={{ display: "none" }} 
                onChange={e => e.target.files?.[0] && handleBannerSelect(e.target.files[0])} 
              />
            </div>

            {/* Poster */}
            <div>
              <label style={S.label}>Poster (460×650)</label>
              <div
                onClick={() => document.getElementById("poster-input")?.click()}
                style={{
                  height: "60px", border: "1px dashed #333", borderRadius: "7px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", background: "#0d0d0d",
                  position: "relative",
                }}
              >
                {posterUploading ? (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "4px",
                  }}>
                    <div style={{
                      width: "16px", height: "16px",
                      border: "2px solid #333",
                      borderTop: "2px solid #01FF48",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                    <span style={{ fontSize: "0.6rem", color: "#888" }}>Uploading...</span>
                  </div>
                ) : posterURL ? (
                  <img 
                    src={posterURL} 
                    style={{ 
                      width: "100%", height: "100%", objectFit: "cover",
                      objectPosition: `${posterPosition.x}% ${posterPosition.y}%`
                    }} 
                    alt="" 
                  />
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "#444" }}>Click to upload</span>
                )}
              </div>
              <input 
                id="poster-input"
                type="file" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={e => e.target.files?.[0] && handlePosterSelect(e.target.files[0])} 
              />
            </div>
          </div>

          {/* ── Titles row — ~65px ── */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Title (EN)</label>
              <input {...register("nameEn")} placeholder="e.g. Solo Leveling" style={S.input} />
              {errors.nameEn && <p style={S.err}>{errors.nameEn.message}</p>}
            </div>
            <div>
              <label style={{ ...S.label, textAlign: "right" }}>العنوان (AR)</label>
              <input {...register("nameAr")} dir="rtl" placeholder="مثال: سولو ليفلينج" style={{ ...S.input, textAlign: "right" }} />
              {errors.nameAr && <p style={{ ...S.err, textAlign: "right" }}>{errors.nameAr.message}</p>}
            </div>
          </div>

          {/* ── Descriptions row — ~90px ── */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Description (EN)</label>
              <textarea {...register("descriptionEn")} rows={2} placeholder="Enter storyline in English..." style={{ ...S.input, resize: "none" }} />
              {errors.descriptionEn && <p style={S.err}>{errors.descriptionEn.message}</p>}
            </div>
            <div>
              <label style={{ ...S.label, textAlign: "right" }}>الوصف (AR)</label>
              <textarea {...register("descriptionAr")} dir="rtl" rows={2} placeholder="أدخل ملخص القصة بالعربية..." style={{ ...S.input, resize: "none", textAlign: "right" }} />
              {errors.descriptionAr && <p style={{ ...S.err, textAlign: "right" }}>{errors.descriptionAr.message}</p>}
            </div>
          </div>

          {/* ── Status + Checkboxes row — ~55px ── */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Status</label>
              <select {...register("status")} style={S.input}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", paddingBottom: "2px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" {...register("isFeatured")} style={{ accentColor: "#01FF48", width: "13px", height: "13px" }} />
                <span style={{ fontSize: "0.7rem", color: "#ccc", fontWeight: 700, textTransform: "uppercase" }}>Hero</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" {...register("isPublished")} style={{ accentColor: "#01FF48", width: "13px", height: "13px" }} />
                <span style={{ fontSize: "0.7rem", color: "#ccc", fontWeight: 700, textTransform: "uppercase" }}>Published</span>
              </label>
            </div>
          </div>

          {/* ── Genres — ~90px ── */}
          <div>
            <label style={S.label}>
              Genres {errors.genres && <span style={{ color: "#f87171", fontWeight: 400 }}>— {errors.genres.message}</span>}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  style={{
                    padding: "3px 9px", borderRadius: "5px",
                    fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                    cursor: "pointer",
                    border: selectedGenres?.includes(genre) ? "1px solid #01FF48" : "1px solid #2a2a2a",
                    background: selectedGenres?.includes(genre) ? "#01FF48" : "#181818",
                    color: selectedGenres?.includes(genre) ? "#000" : "#666",
                    transition: "all 0.1s",
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER — ~50px, always visible */}
        <div style={{
          padding: "10px 16px", borderTop: "1px solid #222",
          display: "flex", gap: "8px", justifyContent: "flex-end",
          background: "#0c0c0c", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "1px solid #2a2a2a",
              color: "#777", padding: "7px 16px", borderRadius: "7px",
              cursor: "pointer", fontSize: "0.82rem",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            style={{
              background: loading ? "#1a1a1a" : "#01FF48",
              border: "none",
              color: loading ? "#555" : "#000",
              padding: "7px 20px", borderRadius: "7px",
              fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              minWidth: "110px", fontSize: "0.82rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            }}
          >
            {loading && <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />}
            {loading ? "Saving..." : manga ? "Update Manga" : "Create Manga"}
          </button>
        </div>

      </div>

      {/* ── Position Pickers ── */}
      {showBannerPicker && bannerURL && (
        <ImagePositionPicker
          imageURL={bannerURL}
          aspectRatio="banner"
          onSave={(pos) => { setBannerPosition(pos); setShowBannerPicker(false); }}
          onCancel={() => setShowBannerPicker(false)}
          currentPosition={bannerPosition}
        />
      )}
      {showPosterPicker && posterURL && (
        <ImagePositionPicker
          imageURL={posterURL}
          aspectRatio="square"
          onSave={(pos) => { setPosterPosition(pos); setShowPosterPicker(false); }}
          onCancel={() => setShowPosterPicker(false)}
          currentPosition={posterPosition}
        />
      )}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
