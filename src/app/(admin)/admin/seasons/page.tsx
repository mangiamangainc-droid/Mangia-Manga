"use client";

import { useState, useEffect } from "react";
import { Plus, Layers, FileText, ChevronRight, Edit, Trash2, ExternalLink, Image as ImageIcon, Upload, Loader2, X, Clock } from "lucide-react";
import { useManga } from "@/hooks/useManga";
import { useSeasons } from "@/hooks/useChapters";
import { Manga, Season, Chapter as Episode } from "@/types";
import { EpisodeModal } from "@/components/admin/ChapterModal";
import { ImagePositionPicker } from "@/components/ui/ImagePositionPicker";
import { collection, addDoc, doc, deleteDoc, Timestamp, increment, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";

export default function SeasonsManagementPage() {
  const { manga } = useManga();
  
  // We add this block for global spin animations:
  if (typeof document !== "undefined" && !document.getElementById("spinner-styles")) {
    const style = document.createElement("style");
    style.id = "spinner-styles";
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  const [selectedMangaId, setSelectedMangaId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  
  const { seasons, loading: loadingSeasons } = useSeasons(selectedMangaId);
  
  // Real-time episodes fetching
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editingSeason, setEditingSeason] = useState<any | null>(null);
  const [isEditSeasonModalOpen, setIsEditSeasonModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedSeasonId) {
      setEpisodes([]);
      return;
    }

    setLoadingEpisodes(true);
    const q = query(
      collection(db, Collections.CHAPTERS), 
      where("seasonId", "==", selectedSeasonId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eps = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Episode[];
      eps.sort((a: any, b: any) => {
        const numA = a.episodeNumber ?? a.chapterNumber ?? 0;
        const numB = b.episodeNumber ?? b.chapterNumber ?? 0;
        return numA - numB;
      });
      setEpisodes(eps);
      setLoadingEpisodes(false);
    }, (error) => {
      console.error(error);
      setLoadingEpisodes(false);
    });

    return () => unsubscribe();
  }, [selectedSeasonId]);

  const handleDeleteSeason = async (id: string) => {
    if (window.confirm("Delete this season and all its episodes?")) {
      try {
        await deleteDoc(doc(db, "seasons", id));
        toast.success("Season deleted");
        if (selectedSeasonId === id) setSelectedSeasonId("");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleEditEpisode = (e: Episode) => {
    setEditingEpisode(e);
    setIsEpisodeModalOpen(true);
  };

  const handleDeleteEpisode = async (id: string) => {
    if (window.confirm("Are you sure?")) {
      try {
        await deleteDoc(doc(db, Collections.CHAPTERS, id));
        toast.success("Episode deleted");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const getEpisodeStatus = (ep: any) => {
    const now = new Date();
    const publishAt = ep.publishAt?.toDate ? ep.publishAt.toDate() : ep.publishAt ? new Date(ep.publishAt) : null;
    if (ep.status === "scheduled" && publishAt && publishAt > now) {
      return {
        label: `${publishAt.toLocaleDateString()} ${publishAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        color: "#FFA500",
        bg: "rgba(255,165,0,0.1)",
        border: "rgba(255,165,0,0.3)",
        publishAt,
      };
    }
    return { label: "Published", color: "#01FF48", bg: "rgba(1,255,72,0.1)", border: "rgba(1,255,72,0.3)", publishAt: null };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Seasons & Episodes</h1>
          <p className="text-sm text-dark-subtext mt-1">Manage content structure and upload episodes.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-dark-subtext uppercase">Select Manga:</label>
          <select 
            value={selectedMangaId}
            onChange={(e) => {
              setSelectedMangaId(e.target.value);
              setSelectedSeasonId("");
            }}
            className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 min-w-[200px]"
          >
            <option value="">Choose a Manga...</option>
            {manga.map(m => (
              <option key={m.id} value={m.id}>{m.nameEn}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedMangaId ? (
        <div className="bg-[#0B0B0E] p-16 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Manga Selected</h2>
          <p className="text-dark-subtext max-w-md">Please select a manga from the dropdown menu above to start managing its seasons and episodes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Seasons Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Seasons</h3>
              <button 
                onClick={() => setIsSeasonModalOpen(true)}
                className="text-primary hover:text-white flex items-center gap-1 text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> NEW SEASON
              </button>
            </div>
            <div className="space-y-2">
              {seasons.map((season) => (
                <div 
                  key={season.id}
                  onClick={() => setSelectedSeasonId(season.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedSeasonId === season.id 
                      ? "bg-primary/10 border-primary/30 text-white" 
                      : "bg-[#0B0B0E] border-white/5 text-dark-subtext hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {season.posterURL ? (
                      <img src={season.posterURL} alt={season.nameEn} className="w-10 h-14 object-cover rounded-md border border-white/10" />
                    ) : (
                      <div className={`w-10 h-14 rounded-md flex flex-col items-center justify-center text-[10px] font-bold ${
                        selectedSeasonId === season.id ? "bg-primary text-black" : "bg-black text-dark-subtext border border-white/10"
                      }`}>
                        S{season.seasonNumber}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{season.nameEn || `Season ${season.seasonNumber}`}</p>
                      <p className="text-[10px] uppercase opacity-60">{season.nameAr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSeason(season); setIsEditSeasonModalOpen(true); }}
                      className="p-1.5 hover:bg-primary/20 rounded-md text-primary"
                      title="Edit Season"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSeason(season.id); }} className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
              {seasons.length === 0 && !loadingSeasons && (
                <p className="text-xs text-dark-subtext text-center py-8">No seasons added yet.</p>
              )}
            </div>
          </div>

          {/* Episodes Content */}
          <div className="lg:col-span-8 space-y-4">
            {!selectedSeasonId ? (
              <div className="bg-[#0B0B0E] p-24 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-dark-muted mb-4" />
                <p className="text-dark-subtext">Select a season to view and manage its episodes.</p>
              </div>
            ) : (
              <div className="bg-[#0B0B0E] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div>
                    <h3 className="text-lg font-bold text-white">Episodes in Season {seasons.find(s => s.id === selectedSeasonId)?.seasonNumber}</h3>
                    <p className="text-xs text-dark-subtext">Total: {episodes.length} episodes</p>
                  </div>
                  <button 
                    onClick={() => { setEditingEpisode(null); setIsEpisodeModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> UPLOAD EPISODE
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-dark-subtext">
                    <thead className="bg-black/50 text-xs uppercase font-bold text-white border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">#</th>
                         <th className="px-6 py-4">Title</th>
                         <th className="px-6 py-4">Type</th>
                         <th className="px-6 py-4">Access</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {episodes.map((episode: any) => {
                         const status = getEpisodeStatus(episode);
                         return (
                           <tr key={episode.id} className="hover:bg-white/[0.02] transition-colors">
                             <td className="px-6 py-4 font-bold text-white">{episode.episodeNumber || episode.chapterNumber}</td>
                             <td className="px-6 py-4">
                               <p className="text-white font-medium">{episode.titleEN || episode.titleEn}</p>
                               <p className="text-xs">{episode.titleAR || episode.titleAr}</p>
                             </td>
                             <td className="px-6 py-4">
                               {episode.contentType === "pdf" || episode.pdfURL ? (
                                 <span className="flex items-center gap-1.5 text-blue-400">
                                   <FileText className="w-3.5 h-3.5" /> PDF
                                 </span>
                               ) : (
                                 <span className="flex items-center gap-1.5 text-purple-400">
                                   <ExternalLink className="w-3.5 h-3.5" /> Link
                                 </span>
                               )}
                             </td>
                             <td className="px-6 py-4">
                               {episode.isFree ? (
                                 <span className="badge badge-primary text-[10px]">FREE</span>
                               ) : (
                                 <span className="badge bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]">PREMIUM</span>
                               )}
                             </td>
                             <td className="px-6 py-4">
                               <div
                                 style={{
                                   display: "inline-flex", flexDirection: "column", gap: "2px",
                                   padding: "4px 10px", borderRadius: "8px",
                                   background: status.bg, border: `1px solid ${status.border}`,
                                 }}
                               >
                                 <span style={{ fontSize: "0.65rem", fontWeight: 900, color: status.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                   {status.publishAt ? "Scheduled" : "Published"}
                                 </span>
                                 {status.publishAt ? (
                                   <CountdownTimer publishAt={status.publishAt} />
                                 ) : (
                                   <span style={{ fontSize: "0.6rem", color: "rgba(1,255,72,0.6)" }}>Live</span>
                                 )}
                               </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-1">
                                 <button onClick={() => handleEditEpisode(episode)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                                   <Edit className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDeleteEpisode(episode.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </td>
                           </tr>
                         );
                       })}
                      {episodes.length === 0 && !loadingEpisodes && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-dark-subtext">No episodes uploaded for this season.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMangaId && selectedSeasonId && (
        <EpisodeModal 
          isOpen={isEpisodeModalOpen}
          onClose={() => setIsEpisodeModalOpen(false)}
          mangaId={selectedMangaId}
          seasonId={selectedSeasonId}
          episode={editingEpisode}
        />
      )}

      {selectedMangaId && (
        <SeasonModal 
          isOpen={isSeasonModalOpen}
          onClose={() => setIsSeasonModalOpen(false)}
          mangaId={selectedMangaId}
          nextSeasonNumber={seasons.length + 1}
        />
      )}

      {editingSeason && (
        <EditSeasonModal
          isOpen={isEditSeasonModalOpen}
          onClose={() => { setIsEditSeasonModalOpen(false); setEditingSeason(null); }}
          season={editingSeason}
        />
      )}
    </div>
  );
}

function SeasonModal({
  isOpen,
  onClose,
  mangaId,
  nextSeasonNumber
}: {
  isOpen: boolean;
  onClose: () => void;
  mangaId: string;
  nextSeasonNumber: number;
}) {
  const [nameEN, setNameEN] = useState(`Season ${nextSeasonNumber}`);
  const [nameAR, setNameAR] = useState(`الموسم ${nextSeasonNumber}`);
  const [seasonNumber, setSeasonNumber] = useState(nextSeasonNumber);
  const [status, setStatus] = useState("ongoing");
  const [posterURL, setPosterURL] = useState("");
  const [posterPosition, setPosterPosition] = useState({ x: 50, y: 50 });
  const [posterUploading, setPosterUploading] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNameEN(`Season ${nextSeasonNumber}`);
      setNameAR(`الموسم ${nextSeasonNumber}`);
      setSeasonNumber(nextSeasonNumber);
      setStatus("ongoing");
      setPosterURL("");
      setPosterPosition({ x: 50, y: 50 });
    }
  }, [isOpen, nextSeasonNumber]);

  const handlePosterSelect = async (file: File) => {
    setPosterUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/seasons");
      setPosterURL(url);
      setShowPosterPicker(true);
      toast.success("Poster uploaded!");
    } catch (err) { toast.error("Poster upload failed!"); }
    setPosterUploading(false);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "seasons"), {
        nameEn: nameEN,
        nameAr: nameAR,
        seasonNumber: Number(seasonNumber),
        status,
        posterURL: posterURL || "",
        posterPosition: posterPosition || { x: 50, y: 50 },
        mangaId: mangaId,
        createdAt: Timestamp.now(),
      });

      // Update manga totalSeasons
      await updateDoc(doc(db, "manga", mangaId), {
        totalSeasons: increment(1)
      }).catch((err) => console.error("Failed to update manga season count", err));

      toast.success("Season added!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to add season");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/88 backdrop-blur-sm">
      <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Season
          </h2>
          <button onClick={onClose} className="p-2 text-dark-subtext hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Name (EN)</label>
              <input 
                type="text" 
                value={nameEN} 
                onChange={e => setNameEN(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Name (AR)</label>
              <input 
                type="text" 
                value={nameAR} 
                onChange={e => setNameAR(e.target.value)}
                dir="rtl"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Number</label>
              <input 
                type="number" 
                value={seasonNumber} 
                onChange={e => setSeasonNumber(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Status</label>
              <select
                id="season-status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="ongoing">🟢 Ongoing</option>
                <option value="coming_soon">🟠 Coming Soon</option>
                <option value="ended">🔴 Ended</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-[10px] font-black text-dark-subtext uppercase tracking-widest">
              <span>Season Poster</span>
              <span className="bg-black border border-white/10 px-2 py-0.5 rounded-md">460 × 650</span>
            </label>
            <div className="relative h-32 bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handlePosterSelect(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {posterUploading ? (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "8px",
                }}>
                  <div style={{
                    width: "24px", height: "24px",
                    border: "2px solid #333",
                    borderTop: "2px solid #01FF48",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>Uploading...</span>
                </div>
              ) : posterURL ? (
                <>
                  <img 
                    src={posterURL} 
                    className="h-full object-contain" 
                    style={{ objectPosition: `${posterPosition.x}% ${posterPosition.y}%` }}
                    alt="Poster Preview" 
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPosterURL("");
                    }}
                    className="absolute top-2 right-2 z-20 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-dark-subtext group-hover:text-primary transition-colors">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Click to upload poster image</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-dark-subtext hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Season"}
          </button>
        </div>
      </div>

      {showPosterPicker && posterURL && (
        <ImagePositionPicker
          imageURL={posterURL}
          aspectRatio="square"
          onSave={(pos) => { setPosterPosition(pos); setShowPosterPicker(false); }}
          onCancel={() => setShowPosterPicker(false)}
          currentPosition={posterPosition}
        />
      )}
    </div>
  );
}

/* ─── Edit Season Modal ──────────────────────────────────────────────── */
function EditSeasonModal({
  isOpen,
  onClose,
  season,
}: {
  isOpen: boolean;
  onClose: () => void;
  season: any;
}) {
  const [nameEN, setNameEN] = useState(season.nameEn || "");
  const [nameAR, setNameAR] = useState(season.nameAr || "");
  const [seasonNumber, setSeasonNumber] = useState(season.seasonNumber || 1);
  const [status, setStatus] = useState(season.status || "ongoing");
  const [posterURL, setPosterURL] = useState(season.posterURL || "");
  const [posterPosition, setPosterPosition] = useState(season.posterPosition || { x: 50, y: 50 });
  const [posterUploading, setPosterUploading] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state whenever the season prop changes (different season selected)
  useEffect(() => {
    setNameEN(season.nameEn || "");
    setNameAR(season.nameAr || "");
    setSeasonNumber(season.seasonNumber || 1);
    setStatus(season.status || "ongoing");
    setPosterURL(season.posterURL || "");
    setPosterPosition(season.posterPosition || { x: 50, y: 50 });
  }, [season]);

  const handlePosterSelect = async (file: File) => {
    setPosterUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/seasons");
      setPosterURL(url);
      setShowPosterPicker(true);
      toast.success("Poster uploaded!");
    } catch (err) { toast.error("Poster upload failed!"); }
    setPosterUploading(false);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "seasons", season.id), {
        nameEn: nameEN,
        nameAr: nameAR,
        seasonNumber: Number(seasonNumber),
        status,
        posterURL: posterURL || season.posterURL || "",
        posterPosition: posterPosition || season.posterPosition || { x: 50, y: 50 },
      });

      toast.success("Season updated!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to update season");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/88 backdrop-blur-sm">
      <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Season — S{season.seasonNumber}
          </h2>
          <button onClick={onClose} className="p-2 text-dark-subtext hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Name (EN)</label>
              <input
                type="text"
                value={nameEN}
                onChange={e => setNameEN(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Name (AR)</label>
              <input
                type="text"
                value={nameAR}
                onChange={e => setNameAR(e.target.value)}
                dir="rtl"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Number</label>
              <input
                type="number"
                value={seasonNumber}
                onChange={e => setSeasonNumber(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">Season Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="ongoing">🟢 Ongoing</option>
                <option value="coming_soon">🟠 Coming Soon</option>
                <option value="ended">🔴 Ended</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-[10px] font-black text-dark-subtext uppercase tracking-widest">
              <span>Season Poster</span>
              <span className="bg-black border border-white/10 px-2 py-0.5 rounded-md">460 × 650</span>
            </label>
            <div className="relative h-32 bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handlePosterSelect(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {posterUploading ? (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "8px",
                }}>
                  <div style={{
                    width: "24px", height: "24px",
                    border: "2px solid #333",
                    borderTop: "2px solid #01FF48",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>Uploading...</span>
                </div>
              ) : posterURL ? (
                <>
                  <img 
                    src={posterURL} 
                    className="h-full object-contain" 
                    style={{ objectPosition: `${posterPosition.x}% ${posterPosition.y}%` }}
                    alt="Poster Preview" 
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPosterURL("");
                    }}
                    className="absolute top-2 right-2 z-20 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-dark-subtext group-hover:text-primary transition-colors">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Click to replace poster image</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-dark-subtext hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {showPosterPicker && posterURL && (
        <ImagePositionPicker
          imageURL={posterURL}
          aspectRatio="square"
          onSave={(pos) => { setPosterPosition(pos); setShowPosterPicker(false); }}
          onCancel={() => setShowPosterPicker(false)}
          currentPosition={posterPosition}
        />
      )}
    </div>
  );
}

/* ─── CountdownTimer ─────────────────────────────────────────────────── */
function CountdownTimer({ publishAt }: { publishAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = publishAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Publishing now..."); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [publishAt]);

  return (
    <span style={{ fontSize: "0.6rem", color: "#FFA500", display: "flex", alignItems: "center", gap: "3px" }}>
      <Clock style={{ width: "9px", height: "9px" }} /> {timeLeft}
    </span>
  );
}
