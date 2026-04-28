"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Upload, Loader2, Link as LinkIcon, FileText, Clock, Calendar, Play } from "lucide-react";
import { motion } from "framer-motion";
import { collection, addDoc, doc, updateDoc, Timestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import toast from "react-hot-toast";

// Use an extended Episode type that supports both old and new schema fields
// so we don't break existing data on edit.
type Episode = any;

const episodeSchema = z.object({
  episodeNumber: z.number().min(0.1, "Episode number must be positive"),
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  isFree: z.boolean().default(true),
  externalURL: z.string().optional(),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

interface EpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaId: string;
  seasonId: string;
  episode?: Episode | null;
}

async function uploadPDFToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "mangia_uploads");
  formData.append("folder", "mangia/episodes");
  formData.append("resource_type", "raw");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/ddofyuprl/raw/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

export function EpisodeModal({ isOpen, onClose, mangaId, seasonId, episode }: EpisodeModalProps) {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"link" | "pdf">("link");
  const [publishType, setPublishType] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      episodeNumber: 1,
      titleEn: "",
      titleAr: "",
      isFree: true,
      externalURL: "",
    },
  });

  const isFree = watch("isFree");

  useEffect(() => {
    if (episode) {
      const oldType = episode.pdfURL ? "pdf" : "link";
      const currentType = episode.contentType || oldType;
      
      let linkValue = "";
      if (currentType === "link") {
        linkValue = episode.contentURL || episode.externalURL || "";
      }

      reset({
        episodeNumber: episode.episodeNumber ?? episode.chapterNumber ?? 1,
        titleEn: episode.titleEN ?? episode.titleEn ?? "",
        titleAr: episode.titleAR ?? episode.titleAr ?? "",
        isFree: episode.isFree ?? true,
        externalURL: linkValue,
      });
      setUploadType(currentType);
      setPublishType(episode.status === "scheduled" ? "scheduled" : "now");
    } else {
      reset({
        episodeNumber: 1,
        titleEn: "",
        titleAr: "",
        isFree: true,
        externalURL: "",
      });
      setUploadType("link");
      setPublishType("now");
      setScheduledDate("");
      setScheduledTime("");
    }
  }, [episode, reset, isOpen]);

  const onSubmit = async (data: EpisodeFormValues) => {
    setLoading(true);
    try {
      let contentURL = "";

      // 1. Handle PDF Upload
      if (uploadType === "pdf") {
        if (!pdfFile && !episode?.contentURL && !episode?.pdfURL) {
          throw new Error("Please upload a PDF file");
        }
        if (pdfFile) {
          contentURL = await uploadPDFToCloudinary(pdfFile);
        } else {
          // Keep existing URL if no new file is selected
          contentURL = episode.contentURL || episode.pdfURL;
        }
      } 
      // 2. Handle External Link
      else {
        if (!data.externalURL || data.externalURL.trim() === "") {
          throw new Error("Please provide a valid external link");
        }
        try {
          new URL(data.externalURL); // Validates the URL
        } catch {
          throw new Error("Invalid URL format");
        }
        contentURL = data.externalURL;
      }

      // 3. Build Firestore Document
      const publishAt = publishType === "now"
        ? new Date()
        : new Date(`${scheduledDate}T${scheduledTime || "00:00"}`);

      const episodeData = {
        episodeNumber: data.episodeNumber,
        titleEN: data.titleEn,
        titleAR: data.titleAr,
        contentType: uploadType,
        contentURL: contentURL,
        isFree: data.isFree,
        seasonId,
        mangaId,
        publishAt: Timestamp.fromDate(publishAt),
        isPublished: publishType === "now",
        status: publishType === "now" ? "published" : "scheduled",
        updatedAt: Timestamp.now(),
      };

      // We use Collections.CHAPTERS as it acts as the episodes collection
      if (episode?.id) {
        await updateDoc(doc(db, Collections.CHAPTERS, episode.id), episodeData);
        toast.success("Episode updated successfully!");
      } else {
        await addDoc(collection(db, Collections.CHAPTERS), {
          ...episodeData,
          createdAt: Timestamp.now(),
          views: 0,
        });
        
        // Update manga total episodes count
        await updateDoc(doc(db, Collections.MANGA, mangaId), {
          totalChapters: increment(1)
        });
        
        toast.success(publishType === "now" ? "Episode uploaded successfully!" : `Episode scheduled for ${publishAt.toLocaleDateString()}!`);
      }

      onClose();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to save episode";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/88 backdrop-blur-sm" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#0B0B0E] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white">{episode ? "Edit Episode" : "Upload Episode"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-dark-subtext">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest">Ep. Number</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("episodeNumber", { valueAsNumber: true })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest">Access Type</label>
                <div className="flex bg-black border border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setValue("isFree", true)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${isFree ? "bg-primary text-black" : "text-dark-subtext"}`}
                  >
                    FREE
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("isFree", false)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isFree ? "bg-yellow-500 text-black" : "text-dark-subtext"}`}
                  >
                    PREMIUM
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest">Title (EN)</label>
                <input
                  {...register("titleEn")}
                  placeholder="e.g. The Beginning"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                />
                {errors.titleEn && <p className="text-[10px] text-red-500 mt-1">{errors.titleEn.message}</p>}
              </div>
              <div dir="rtl">
                <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest text-right">عنوان الحلقة (AR)</label>
                <input
                  {...register("titleAr")}
                  placeholder="مثال: البداية"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white text-right focus:outline-none focus:border-primary/50"
                />
                {errors.titleAr && <p className="text-[10px] text-red-500 mt-1 text-right">{errors.titleAr.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-dark-subtext mb-2 uppercase tracking-widest">Content Source</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setUploadType("link")}
                  className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    uploadType === "link" ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/10 text-dark-subtext hover:border-white/20"
                  }`}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">External Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("pdf")}
                  className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    uploadType === "pdf" ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/10 text-dark-subtext hover:border-white/20"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">PDF Upload</span>
                </button>
              </div>
            </div>

            {uploadType === "link" ? (
              <div>
                <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest">URL Source</label>
                <input
                  {...register("externalURL")}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            ) : (
              <div className="relative aspect-[4/1] bg-black border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center group hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-dark-subtext group-hover:text-primary" />
                  <span className="text-[10px] font-black text-dark-subtext">
                    {pdfFile ? pdfFile.name : (episode?.contentType === 'pdf' || episode?.pdfURL ? "UPDATE PDF" : "CHOOSE PDF")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Publish Settings ── */}
          <div>
            <label className="block text-[10px] font-black text-dark-subtext mb-2 uppercase tracking-widest">Publish Settings</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPublishType("now")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                  publishType === "now"
                    ? "bg-primary text-black border-primary"
                    : "bg-black text-dark-subtext border-white/10 hover:border-white/30"
                }`}
              >
                <Play className="w-3 h-3" /> Publish Now
              </button>
              <button
                type="button"
                onClick={() => setPublishType("scheduled")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                  publishType === "scheduled"
                    ? "bg-[#FFA500] text-black border-[#FFA500]"
                    : "bg-black text-dark-subtext border-white/10 hover:border-white/30"
                }`}
              >
                <Clock className="w-3 h-3" /> Schedule
              </button>
            </div>

            {publishType === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-black border border-[#FFA500]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFA500]/70 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext mb-1.5 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full bg-black border border-[#FFA500]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFA500]/70 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-black shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-12 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (episode ? "UPDATE EPISODE" : "UPLOAD EPISODE")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
