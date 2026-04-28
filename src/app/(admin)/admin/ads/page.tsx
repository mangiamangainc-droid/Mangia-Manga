"use client";

import { useState, useEffect } from "react";
import {
  Upload, Loader2, Save, Trash2, Image as ImageIcon,
  PlusCircle, X, ChevronDown, Edit2, Clock, Check
} from "lucide-react";
import {
  collection, doc, getDoc, getDocs, setDoc,
  addDoc, deleteDoc, onSnapshot, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { Manga } from "@/types";
import { ImagePositionPicker } from "@/components/ui/ImagePositionPicker";
import { uploadToCloudinary } from "@/lib/cloudinary";

/* ── Ad document shape saved to `ads` collection ── */
interface MangaAd {
  id: string;
  type?: "existing" | "coming_soon";
  isComingSoon?: boolean;
  mangaId?: string;
  mangaName?: string;
  titleEN?: string;
  titleAR?: string;
  imageURL: string;
  imagePosition?: { x: number; y: number };
  description: string;
  languages: string[];   // ["AR", "EN"]
  hasHD: boolean;
  createdAt: any;
}

export default function AdsManagementPage() {
  /* ────────────── Site Logo state ────────────── */
  const [logoURL, setLogoURL] = useState("");
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 50 });
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);

  /* ────────────── Login Page state ────────────── */
  const [loginMediaURL, setLoginMediaURL] = useState("");
  const [loginMediaPosition, setLoginMediaPosition] = useState({ x: 50, y: 50 });
  const [loginPage, setLoginPage] = useState({ title: "", subtitle: "" });
  const [loadingLogin, setLoadingLogin] = useState(true);
  const [savingLogin, setSavingLogin] = useState(false);
  const [loginUploading, setLoginUploading] = useState(false);
  const [showLoginPicker, setShowLoginPicker] = useState(false);

  /* ────────────── Register Page state ────────────── */
  const [registerMediaURL, setRegisterMediaURL] = useState("");
  const [registerMediaPosition, setRegisterMediaPosition] = useState({ x: 50, y: 50 });
  const [registerPage, setRegisterPage] = useState({ title: "", subtitle: "" });
  const [loadingRegister, setLoadingRegister] = useState(true);
  const [savingRegister, setSavingRegister] = useState(false);
  const [registerUploading, setRegisterUploading] = useState(false);
  const [showRegisterPicker, setShowRegisterPicker] = useState(false);

  /* ────────────── Homepage Ad Banner state ────────────── */
  const [adBannerImageURL, setAdBannerImageURL] = useState("");
  const [adBannerImagePosition, setAdBannerImagePosition] = useState({ x: 50, y: 50 });
  const [adBanner, setAdBanner] = useState({
    bgColor: "#EAB308",
    textColor: "#000000",
    titleEN: "", titleAR: "",
    descEN: "", descAR: "",
    btnEN: "", btnAR: "",
  });
  const [savingAdBanner, setSavingAdBanner] = useState(false);
  const [adBannerUploading, setAdBannerUploading] = useState(false);
  const [showAdBannerPicker, setShowAdBannerPicker] = useState(false);
  const [buttons, setButtons] = useState<Array<{
    id: string;
    labelEN: string;
    labelAR: string;
    href: string;
    style: "text" | "filled" | "outline" | "rounded";
    color: string;
    textColor: string;
  }>>([]);
  const [editingButton, setEditingButton] = useState<string | null>(null);


  const addButton = () => {
    const newBtn: any = {
      id: Date.now().toString(),
      labelEN: "",
      labelAR: "",
      href: "/plans",
      style: "filled",
      color: "#000000",
      textColor: "#ffffff",
    };
    setButtons(prev => [...prev, newBtn]);
    setEditingButton(newBtn.id); 
  };

  const removeButton = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [ads, setAds] = useState<MangaAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adType, setAdType] = useState<"existing" | "coming_soon">("existing");
  const [comingSoonTitleEN, setComingSoonTitleEN] = useState("");
  const [comingSoonTitleAR, setComingSoonTitleAR] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [launchTime, setLaunchTime] = useState("");

  const [adImageURL, setAdImageURL] = useState("");
  const [adImagePosition, setAdImagePosition] = useState({ x: 50, y: 50 });
  const [adUploading, setAdUploading] = useState(false);
  const [showAdPicker, setShowAdPicker] = useState(false);

  const [form, setForm] = useState<{
    mangaId: string;
    description: string;
    languages: string[];
    hasHD: boolean;
  }>({
    mangaId: "",
    description: "",
    languages: [],
    hasHD: false,
  });
  const [savingAd, setSavingAd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ────────────── Fetch initial data ────────────── */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "siteLogo"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.url) setLogoURL(data.url);
          if (data.position) setLogoPosition(data.position);
        }
      } catch (e) { console.error(e); } finally { setLoadingLogo(false); }
    })();

    (async () => {
      try {
        console.log("[Fetch] Loading loginPage settings...");
        const snap = await getDoc(doc(db, "settings", "loginPage"));
        if (snap.exists()) {
          const data = snap.data();
          console.log("[Fetch] loginPage data:", data);
          setLoginPage({ title: data.title || "", subtitle: data.subtitle || "" });
          if (data.mediaURL) {
            console.log("[Fetch] Setting loginMediaURL:", data.mediaURL);
            setLoginMediaURL(data.mediaURL);
          }
          if (data.mediaPosition) setLoginMediaPosition(data.mediaPosition);
        } else {
          console.log("[Fetch] No loginPage document found");
        }
      } catch (e) { 
        console.error("[Fetch] Error loading loginPage:", e); 
      } finally { setLoadingLogin(false); }
    })();

    (async () => {
      try {
        console.log("[Fetch] Loading registerPage settings...");
        const snap = await getDoc(doc(db, "settings", "registerPage"));
        if (snap.exists()) {
          const data = snap.data();
          console.log("[Fetch] registerPage data:", data);
          setRegisterPage({ title: data.title || "", subtitle: data.subtitle || "" });
          if (data.mediaURL) {
            console.log("[Fetch] Setting registerMediaURL:", data.mediaURL);
            setRegisterMediaURL(data.mediaURL);
          }
          if (data.mediaPosition) setRegisterMediaPosition(data.mediaPosition);
        } else {
          console.log("[Fetch] No registerPage document found");
        }
      } catch (e) { 
        console.error("[Fetch] Error loading registerPage:", e); 
      } finally { setLoadingRegister(false); }
    })();

    (async () => {
      try {
        console.log("[Fetch] Loading adBanner settings...");
        const snap = await getDoc(doc(db, "settings", "adBanner"));
        if (snap.exists()) {
          const data = snap.data() as any;
          console.log("[Fetch] adBanner data:", data);
          setAdBanner(data);
          if (data.buttons) setButtons(data.buttons);
          if (data.imageURL) {
            console.log("[Fetch] Setting adBannerImageURL:", data.imageURL);
            setAdBannerImageURL(data.imageURL);
          }
          if (data.imagePosition) setAdBannerImagePosition(data.imagePosition);
        } else {
          console.log("[Fetch] No adBanner document found");
        }
      } catch (e) { 
        console.error("[Fetch] Error loading adBanner:", e); 
      }
    })();

    (async () => {
      try {
        const snap = await getDocs(collection(db, "manga"));
        setMangas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Manga)));
      } catch (e) { console.error(e); }
    })();

    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MangaAd));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAds(list);
      setLoadingAds(false);
    }, (err) => {
      console.error(err);
      setLoadingAds(false);
    });

    return () => unsub();
  }, []);

  /* ────────────── Upload Handlers ────────────── */
  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/logo");
      setLogoURL(url);
      // Auto-save immediately
      await setDoc(doc(db, "settings", "siteLogo"), { url, position: logoPosition });
      toast.success("Logo uploaded and saved!");
    } catch (err) { 
      toast.error(err instanceof Error ? err.message : "Logo upload failed!"); 
    }
    setLogoUploading(false);
  };

  const handleLoginMediaUpload = async (file: File) => {
    console.log("[Login Upload] Starting upload for file:", file.name, file.type, file.size);
    setLoginUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/login");
      console.log("[Login Upload] Cloudinary returned URL:", url);
      setLoginMediaURL(url);
      
      const saveData = {
        mediaURL: url,
        mediaPosition: loginMediaPosition,
        title: loginPage.title,
        subtitle: loginPage.subtitle,
      };
      console.log("[Login Upload] Saving to Firestore:", saveData);
      await setDoc(doc(db, "settings", "loginPage"), saveData);
      console.log("[Login Upload] Firestore save complete");
      toast.success("Login image saved to Cloudinary!");
    } catch (err) { 
      console.error("[Login Upload] Error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed!"); 
    }
    setLoginUploading(false);
  };

  const handleRegisterMediaUpload = async (file: File) => {
    console.log("[Register Upload] Starting upload for file:", file.name, file.type, file.size);
    setRegisterUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/register");
      console.log("[Register Upload] Cloudinary returned URL:", url);
      setRegisterMediaURL(url);
      
      const saveData = {
        mediaURL: url,
        mediaPosition: registerMediaPosition,
        title: registerPage.title,
        subtitle: registerPage.subtitle,
      };
      console.log("[Register Upload] Saving to Firestore:", saveData);
      await setDoc(doc(db, "settings", "registerPage"), saveData);
      console.log("[Register Upload] Firestore save complete");
      toast.success("Register image saved to Cloudinary!");
    } catch (err) { 
      console.error("[Register Upload] Error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed!"); 
    }
    setRegisterUploading(false);
  };

  const handleAdBannerUpload = async (file: File) => {
    console.log("[AdBanner Upload] Starting upload for file:", file.name, file.type, file.size);
    setAdBannerUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/ad-banner");
      console.log("[AdBanner Upload] Cloudinary returned URL:", url);
      setAdBannerImageURL(url);
      toast.success("Image uploaded to Cloudinary! Click 'Save Ad Banner' to persist.");
    } catch (err) { 
      console.error("[AdBanner Upload] Error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed!"); 
    }
    setAdBannerUploading(false);
  };

  const handleAdUpload = async (file: File) => {
    setAdUploading(true);
    try {
      const url = await uploadToCloudinary(file, "mangia/ads");
      setAdImageURL(url); // Save real permanent URL immediately
      setShowAdPicker(true);
      toast.success("Ad image uploaded!");
    } catch (err) { 
      toast.error(err instanceof Error ? err.message : "Ad upload failed!"); 
    }
    setAdUploading(false);
  };

  const handleSaveLogo = async () => {
    if (!logoURL) { toast.error("No logo file selected"); return; }
    setSavingLogo(true);
    try {
      await setDoc(doc(db, "settings", "siteLogo"), { 
        url: logoURL,
        position: logoPosition 
      });
      toast.success("Site logo saved!");
    } catch (e: any) { toast.error(e.message || "Failed to save logo"); } finally { setSavingLogo(false); }
  };

  const handleSaveLogin = async () => {
    setSavingLogin(true);
    try {
      const data = { 
        ...loginPage, 
        mediaURL: loginMediaURL,
        mediaPosition: loginMediaPosition 
      };
      await setDoc(doc(db, "settings", "loginPage"), data);
      toast.success("Login page settings saved!");
    } catch (e: any) { toast.error(e.message || "Failed to save login settings"); } finally { setSavingLogin(false); }
  };

  const handleSaveRegister = async () => {
    setSavingRegister(true);
    try {
      const data = { 
        ...registerPage, 
        mediaURL: registerMediaURL,
        mediaPosition: registerMediaPosition 
      };
      await setDoc(doc(db, "settings", "registerPage"), data);
      toast.success("Register page settings saved!");
    } catch (e: any) { toast.error(e.message || "Failed to save register settings"); } finally { setSavingRegister(false); }
  };

  const handleSaveAdBanner = async () => {
    setSavingAdBanner(true);
    try {
      const payload = { 
        ...adBanner, 
        imageURL: adBannerImageURL,
        imagePosition: adBannerImagePosition,
        buttons 
      };
      await setDoc(doc(db, "settings", "adBanner"), payload);
      setAdBanner(payload);
      toast.success("Ad banner saved!");
    } catch (e: any) { toast.error(e.message || "Failed to save ad banner"); } finally { setSavingAdBanner(false); }
  };

  const handleSaveAd = async () => {
    if (adType === "existing" && !form.mangaId) { toast.error("Select a manga first"); return; }
    if (adType === "coming_soon" && !comingSoonTitleEN) { toast.error("Enter an English title"); return; }
    
    if (!adImageURL) { toast.error("Upload an image or GIF"); return; }

    setSavingAd(true);
    try {
      const selectedManga = mangas.find(m => m.id === form.mangaId);
      const adData: any = {
        type: adType,
        isComingSoon: adType === "coming_soon",
        mangaId: adType === "existing" ? form.mangaId : null,
        mangaName: adType === "existing" ? (selectedManga?.nameEn || "") : null,
        titleEN: adType === "coming_soon" ? comingSoonTitleEN : (selectedManga?.nameEn || ""),
        titleAR: adType === "coming_soon" ? comingSoonTitleAR : (selectedManga?.nameAr || ""),
        imageURL: adImageURL,
        imagePosition: adImagePosition,
        description: form.description,
        languages: form.languages,
        hasHD: form.hasHD,
        launchAt: adType === "coming_soon" && launchDate && launchTime ? new Date(`${launchDate}T${launchTime}`) : null,
      };
      if (editingId) {
        await updateDoc(doc(db, "ads", editingId), adData);
        toast.success("Ad updated!");
      } else {
        await addDoc(collection(db, "ads"), { ...adData, createdAt: serverTimestamp() });
        toast.success("Ad saved!");
      }
      setForm({ mangaId: "", description: "", languages: [], hasHD: false });
      setAdImageURL("");
      setAdType("existing");
      setComingSoonTitleEN("");
      setComingSoonTitleAR("");
      setLaunchDate("");
      setLaunchTime("");
      setEditingId(null);
    } catch (e: any) { toast.error(e.message || "Failed to save ad"); } finally { setSavingAd(false); }
  };

  const handleDeleteAd = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "ads", id));
      toast.success("Ad deleted");
    } catch (e: any) { toast.error(e.message || "Failed to delete"); } finally { setDeletingId(null); }
  };

  const toggleLang = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
    }));
  };

  return (
    <div className="space-y-10 pb-16">
      <div>
        <h1 className="text-2xl font-black text-white">Ads & Graphics</h1>
        <p className="text-sm text-dark-subtext mt-1">
          Manage site logo, login page graphic, and homepage hero carousel ads.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 0 — Site Logo
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#0B0B0E] rounded-2xl border border-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Site Logo</h2>
            <p className="text-xs text-dark-subtext mt-0.5">
              Displayed in the Navbar — recommended 800 × 200 px (transparent PNG preferred)
            </p>
          </div>
          <span className="text-[10px] font-bold text-dark-subtext uppercase tracking-widest bg-black px-2 py-1 rounded-md border border-white/10">
            800 × 200
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-48 h-20 bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {logoUploading ? (
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
            ) : logoURL ? (
              <>
                <img 
                  src={logoURL} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  style={{ objectPosition: `${logoPosition.x}% ${logoPosition.y}%` }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLogoPicker(true); }}
                  className="absolute bottom-1 right-1 z-20 bg-black/70 hover:bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                >
                  Position
                </button>
              </>
            ) : loadingLogo ? (
              <Loader2 className="w-6 h-6 animate-spin text-dark-subtext" />
            ) : (
              <p className="text-xs font-bold">Click to upload logo</p>
            )}
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <p className="text-sm text-dark-subtext max-w-xs">
              Upload a transparent PNG or SVG. If no logo is set, the text{" "}
              <span className="text-primary font-black">MANGIA</span> will be shown instead.
            </p>
            <button
              onClick={handleSaveLogo}
              disabled={savingLogo || !logoURL}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                logoURL
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/5 text-dark-subtext cursor-not-allowed"
              }`}
            >
              {savingLogo
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              Save Logo
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — Login Page Media
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#0B0B0E] rounded-2xl border border-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Login Page Media</h2>
            <p className="text-xs text-dark-subtext mt-0.5">
              Shown on the right side of the login page — recommended 800 × 900 px
            </p>
          </div>
          <span className="text-[10px] font-bold text-dark-subtext uppercase tracking-widest bg-black px-2 py-1 rounded-md border border-white/10">
            800 × 900
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Upload zone */}
          <div className="relative w-full md:w-72 aspect-[8/9] bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex-shrink-0">
            <input
              type="file"
              accept="image/*,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={(e) => e.target.files?.[0] && handleLoginMediaUpload(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {loginUploading ? (
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
            ) : loginMediaURL ? (
              <>
                <img 
                  src={loginMediaURL} 
                  alt="Login" 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${loginMediaPosition.x}% ${loginMediaPosition.y}%` }}
                  onError={(e) => {
                    console.error("[Image Error] Failed to load login image:", loginMediaURL);
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
                <div className="absolute top-2 left-2 z-20 bg-black/70 text-[10px] font-bold px-2 py-1 rounded-md text-primary">
                  {loginMediaURL.includes("cloudinary") ? "☁️ Cloudinary" : "❓ Local"}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLoginPicker(true); }}
                  className="absolute bottom-2 right-2 z-20 bg-black/70 hover:bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                >
                  Position
                </button>
              </>
            ) : loadingLogin ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-dark-subtext" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-dark-subtext group-hover:text-primary transition-colors">
                <Upload className="w-8 h-8" />
                <p className="text-xs font-bold">Click to upload</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Title</label>
              <input
                type="text"
                value={loginPage.title}
                onChange={e => setLoginPage({ ...loginPage, title: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                placeholder="Unlimited Manga."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Subtitle / Description</label>
              <textarea
                value={loginPage.subtitle}
                onChange={e => setLoginPage({ ...loginPage, subtitle: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none h-24"
                placeholder="Read the latest chapters..."
              />
            </div>
            <button
              onClick={handleSaveLogin}
              disabled={savingLogin}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                !savingLogin
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/5 text-dark-subtext cursor-not-allowed"
              }`}
            >
              {savingLogin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Login Page
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 1.5 — Register Page Media
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#0B0B0E] rounded-2xl border border-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Register Page Media</h2>
            <p className="text-xs text-dark-subtext mt-0.5">
              Shown on the left side of the register page — recommended 800 × 900 px
            </p>
          </div>
          <span className="text-[10px] font-bold text-dark-subtext uppercase tracking-widest bg-black px-2 py-1 rounded-md border border-white/10">
            800 × 900
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Upload zone */}
          <div className="relative w-full md:w-72 aspect-[8/9] bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex-shrink-0">
            <input
              type="file"
              accept="image/*,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={(e) => e.target.files?.[0] && handleRegisterMediaUpload(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {registerUploading ? (
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
            ) : registerMediaURL ? (
              <>
                <img 
                  src={registerMediaURL} 
                  alt="Register" 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${registerMediaPosition.x}% ${registerMediaPosition.y}%` }}
                  onError={(e) => {
                    console.error("[Image Error] Failed to load register image:", registerMediaURL);
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
                <div className="absolute top-2 left-2 z-20 bg-black/70 text-[10px] font-bold px-2 py-1 rounded-md text-primary">
                  {registerMediaURL.includes("cloudinary") ? "☁️ Cloudinary" : "❓ Local"}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRegisterPicker(true); }}
                  className="absolute bottom-2 right-2 z-20 bg-black/70 hover:bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                >
                  Position
                </button>
              </>
            ) : loadingRegister ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-dark-subtext" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-dark-subtext group-hover:text-primary transition-colors">
                <Upload className="w-8 h-8" />
                <p className="text-xs font-bold">Click to upload</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Title</label>
              <input
                type="text"
                value={registerPage.title}
                onChange={e => setRegisterPage({ ...registerPage, title: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                placeholder="Join the Community."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Subtitle / Description</label>
              <textarea
                value={registerPage.subtitle}
                onChange={e => setRegisterPage({ ...registerPage, subtitle: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none h-24"
                placeholder="Create an account..."
              />
            </div>
            <button
              onClick={handleSaveRegister}
              disabled={savingRegister}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                !savingRegister
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/5 text-dark-subtext cursor-not-allowed"
              }`}
            >
              {savingRegister ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Register Page
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 1.5 — Homepage Ad Banner
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#0B0B0E] rounded-2xl border border-white/5 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">Homepage Ad Banner</h2>
          <p className="text-xs text-dark-subtext mt-0.5">
            The yellow banner shown on the homepage between Hero and Latest Updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Title (EN)</label>
                <input type="text" value={adBanner.titleEN} onChange={e => setAdBanner(a => ({...a, titleEN: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Title (AR)</label>
                <input type="text" value={adBanner.titleAR} onChange={e => setAdBanner(a => ({...a, titleAR: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Description (EN)</label>
                <input type="text" value={adBanner.descEN} onChange={e => setAdBanner(a => ({...a, descEN: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Description (AR)</label>
                <input type="text" value={adBanner.descAR} onChange={e => setAdBanner(a => ({...a, descAR: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Button Text (EN)</label>
                <input type="text" value={adBanner.btnEN} onChange={e => setAdBanner(a => ({...a, btnEN: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Button Text (AR)</label>
                <input type="text" value={adBanner.btnAR} onChange={e => setAdBanner(a => ({...a, btnAR: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" dir="rtl" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Background Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={adBanner.bgColor} onChange={e => setAdBanner(a => ({...a, bgColor: e.target.value}))} className="w-10 h-10 rounded cursor-pointer bg-black border border-white/10" />
                  <span className="text-sm text-white font-mono">{adBanner.bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Text Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={adBanner.textColor || "#000000"} onChange={e => setAdBanner(a => ({...a, textColor: e.target.value}))} className="w-10 h-10 rounded cursor-pointer bg-black border border-white/10" />
                  <span className="text-sm text-white font-mono">{adBanner.textColor || "#000000"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col">
            <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">Image / GIF</label>
            <div className="relative flex-1 bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center min-h-[150px]">
              <input
                type="file"
                accept="image/*,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={(e) => e.target.files?.[0] && handleAdBannerUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {adBannerUploading ? (
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
              ) : adBannerImageURL ? (
                <>
                  <img 
                    src={adBannerImageURL} 
                    className="max-h-full object-contain p-2"
                    style={{ objectPosition: `${adBannerImagePosition.x}% ${adBannerImagePosition.y}%` }}
                    alt="Ad Banner"
                    onError={(e) => {
                      console.error("[Image Error] Failed to load ad banner image:", adBannerImageURL);
                      (e.target as HTMLImageElement).src = "";
                    }}
                  />
                  <div className="absolute top-2 left-2 z-20 bg-black/70 text-[10px] font-bold px-2 py-1 rounded-md text-primary">
                    {adBannerImageURL.includes("cloudinary") ? "☁️ Cloudinary" : "❓ Local"}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAdBannerPicker(true); }}
                    className="absolute bottom-2 right-2 z-20 bg-black/70 hover:bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                  >
                    Position
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-dark-subtext group-hover:text-primary transition-colors">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Click to upload image or GIF</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Button Editor ── */}
        <div style={{ marginTop: "20px" }}>
          <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-3">Banner Buttons</label>

          {/* Buttons list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {buttons.map((btn, index) => (
              <div key={btn.id}>
                {editingButton === btn.id ? (
                  // EDIT FORM
                  <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "14px", border: "1px solid #01FF48" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#01FF48" }}>Edit Button {index + 1}</span>
                      <button onClick={() => removeButton(btn.id)} style={{ background: "none", border: "none", color: "#ff5555", cursor: "pointer", fontSize: "0.8rem" }}>🗑️ Remove</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>LABEL (EN)</label>
                        <input value={btn.labelEN}
                          onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, labelEN: e.target.value} : b))}
                          placeholder="Plans"
                          style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", borderRadius: "6px", fontSize: "0.85rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>LABEL (AR)</label>
                        <input dir="rtl" value={btn.labelAR}
                          onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, labelAR: e.target.value} : b))}
                          placeholder="الباقات"
                          style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", borderRadius: "6px", fontSize: "0.85rem", textAlign: "right" }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>LINK</label>
                      <input value={btn.href}
                        onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, href: e.target.value} : b))}
                        placeholder="/plans"
                        style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", borderRadius: "6px", fontSize: "0.85rem" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>STYLE</label>
                        <select value={btn.style}
                          onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, style: e.target.value as any} : b))}
                          style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#fff", padding: "8px 10px", borderRadius: "6px" }}>
                          <option value="text">Text Only</option>
                          <option value="filled">Filled</option>
                          <option value="outline">Outline</option>
                          <option value="rounded">Rounded Pill</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>BG COLOR</label>
                        <input type="color" value={btn.color}
                          onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, color: e.target.value} : b))}
                          style={{ width: "100%", height: "36px", borderRadius: "6px", border: "1px solid #2a2a2a", cursor: "pointer" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "4px" }}>TEXT COLOR</label>
                        <input type="color" value={btn.textColor}
                          onChange={e => setButtons(prev => prev.map(b => b.id === btn.id ? {...b, textColor: e.target.value} : b))}
                          style={{ width: "100%", height: "36px", borderRadius: "6px", border: "1px solid #2a2a2a", cursor: "pointer" }} />
                      </div>
                    </div>

                    {/* Preview */}
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ fontSize: "0.72rem", color: "#888", display: "block", marginBottom: "6px" }}>PREVIEW:</label>
                      <button style={{
                        background: btn.style === "text" || btn.style === "outline" ? "transparent" : btn.color,
                        color: btn.style === "text" ? btn.color : btn.textColor,
                        border: btn.style === "outline" ? `2px solid ${btn.color}` : "none",
                        padding: btn.style === "text" ? "4px 0" : "8px 20px",
                        borderRadius: btn.style === "rounded" ? "50px" : "6px",
                        fontWeight: 700, cursor: "default", fontSize: "0.85rem", fontFamily: "inherit",
                        textDecoration: btn.style === "text" ? "underline" : "none",
                      }}>
                        {btn.labelEN || "Button"}
                      </button>
                    </div>

                    {/* Done editing */}
                    <button
                      onClick={() => setEditingButton(null)}
                      style={{ background: "#01FF48", border: "none", color: "#000", padding: "8px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" }}
                    >
                      ✓ Done
                    </button>
                  </div>
                ) : (
                  // COLLAPSED VIEW
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#1a1a1a",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    border: "1px solid #2a2a2a",
                  }}>
                    {/* Button preview */}
                    <button style={{
                      background: btn.style === "text" || btn.style === "outline" ? "transparent" : btn.color,
                      color: btn.style === "text" ? btn.color : btn.textColor,
                      border: btn.style === "outline" ? `2px solid ${btn.color}` : "none",
                      padding: btn.style === "text" ? "4px 0" : "7px 18px",
                      borderRadius: btn.style === "rounded" ? "50px" : "6px",
                      fontWeight: 700, cursor: "default", fontSize: "0.82rem", fontFamily: "inherit",
                    }}>
                      {btn.labelEN || "Button"}
                    </button>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setEditingButton(btn.id)}
                        style={{ background: "rgba(1,255,72,0.1)", border: "none", color: "#01FF48", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => removeButton(btn.id)}
                        style={{ background: "rgba(255,85,85,0.1)", border: "none", color: "#ff5555", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={addButton} style={{
            width: "100%", background: "transparent", border: "1px dashed #333",
            color: "#01FF48", padding: "10px", borderRadius: "8px", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600,
          }}>
            + Add Button
          </button>
        </div>

        {/* ── Save Ad Banner Button ── */}
        <div className="pt-6 mt-4 border-t border-white/10">
          <button
            onClick={handleSaveAdBanner}
            disabled={savingAdBanner}
            className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              !savingAdBanner
                ? "bg-primary text-black hover:bg-primary/90"
                : "bg-white/5 text-dark-subtext cursor-not-allowed"
            }`}
          >
            {savingAdBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Ad Banner
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — Manga Ads (Hero Carousel)
      ══════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Manga Ads — Homepage Hero Carousel</h2>
          <p className="text-xs text-dark-subtext mt-1">
            Each ad is displayed as a slide in the homepage hero. Link an ad to a manga,
            upload a banner image or GIF, add a description, and set language / quality badges.
          </p>
        </div>

        {/* ── Add New Ad Form ── */}
        <div className="bg-[#0B0B0E] rounded-2xl border border-white/5 p-6 space-y-6">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> {editingId ? "Edit Ad" : "Add New Ad"}
          </h3>

          {/* Ad Type Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setAdType("existing")}
              className={`px-5 py-2.5 rounded-xl text-sm font-black border transition-all ${
                adType === "existing"
                  ? "bg-primary text-black border-primary"
                  : "bg-black text-dark-subtext border-white/10 hover:border-white/30"
              }`}
            >
              📚 Existing Manga
            </button>
            <button
              onClick={() => setAdType("coming_soon")}
              className={`px-5 py-2.5 rounded-xl text-sm font-black border transition-all flex items-center gap-2 ${
                adType === "coming_soon"
                  ? "bg-[#FFA500] text-black border-[#FFA500]"
                  : "bg-black text-dark-subtext border-white/10 hover:border-white/30"
              }`}
            >
              <Clock className="w-4 h-4" /> Coming Soon
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: image + selector */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">
                  Banner Image / GIF
                </label>
                <div className="relative h-40 bg-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => e.target.files?.[0] && handleAdUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {adUploading ? (
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
                  ) : adImageURL ? (
                    <>
                      <img 
                        src={adImageURL} 
                        className="w-full h-full object-cover" 
                        style={{ objectPosition: `${adImagePosition.x}% ${adImagePosition.y}%` }}
                        alt="Preview" 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdImageURL("");
                        }}
                        className="absolute top-2 right-2 z-20 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-dark-subtext group-hover:text-primary transition-colors">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-bold">Click to upload image or GIF</span>
                      <span className="text-[10px] text-dark-subtext/60">No size restriction</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manga Selector — shown only for existing */}
              {adType === "existing" && (
                <div>
                  <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">
                    Linked Manga
                  </label>
                  <div className="relative">
                    <select
                      value={form.mangaId}
                      onChange={(e) => setForm(f => ({ ...f, mangaId: e.target.value }))}
                      className="w-full appearance-none bg-black border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="">— Select manga —</option>
                      {mangas.map(m => (
                        <option key={m.id} value={m.id}>{m.nameEn}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-subtext pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Coming Soon title fields */}
              {adType === "coming_soon" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">
                      Title (EN)
                    </label>
                    <input
                      type="text"
                      value={comingSoonTitleEN}
                      onChange={e => setComingSoonTitleEN(e.target.value)}
                      placeholder="e.g. Dragon Chronicles"
                      className="w-full bg-black border border-[#FFA500]/30 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-subtext/50 focus:outline-none focus:border-[#FFA500]/70 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">
                      العنوان (AR)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={comingSoonTitleAR}
                      onChange={e => setComingSoonTitleAR(e.target.value)}
                      placeholder="مثال: مزامير التنين"
                      className="w-full bg-black border border-[#FFA500]/30 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-subtext/50 focus:outline-none focus:border-[#FFA500]/70 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#FFA500] bg-[#FFA500]/10 border border-[#FFA500]/20 rounded-xl px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5" /> This ad will show a &quot;Coming Soon&quot; badge and no link button.
                  </div>

                  {/* Launch date/time */}
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ fontSize: "0.75rem", color: "#FFA500", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                      ⏰ LAUNCH DATE & TIME
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <input
                        type="date"
                        value={launchDate}
                        onChange={e => setLaunchDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        style={{ background: "#1a1a1a", border: "1px solid #FFA500", color: "#fff", padding: "8px 12px", borderRadius: "8px", width: "100%" }}
                      />
                      <input
                        type="time"
                        value={launchTime}
                        onChange={e => setLaunchTime(e.target.value)}
                        style={{ background: "#1a1a1a", border: "1px solid #FFA500", color: "#fff", padding: "8px 12px", borderRadius: "8px", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: description + badges */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Short promo text shown under the title..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-subtext/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              {/* Language & Quality Badges */}
              <div>
                <label className="block text-[10px] font-black text-dark-subtext uppercase tracking-widest mb-3">
                  Language & Quality Badges
                </label>
                <div className="flex flex-wrap gap-2">
                  {["AR", "EN"].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang(lang)}
                      className={`px-4 py-2 rounded-lg text-xs font-black border transition-all ${
                        form.languages.includes(lang)
                          ? "bg-primary text-black border-primary"
                          : "bg-black text-white border-white/10 hover:border-white/30"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, hasHD: !f.hasHD }))}
                    className={`px-4 py-2 rounded-lg text-xs font-black border transition-all ${
                      form.hasHD
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-black text-white border-white/10 hover:border-white/30"
                    }`}
                  >
                    HD
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="space-y-2 mt-2">
                <button
                  onClick={handleSaveAd}
                  disabled={savingAd || !adImageURL}
                  className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    !savingAd && adImageURL
                      ? adType === "coming_soon"
                        ? "bg-[#FFA500] text-black hover:bg-[#FFA500]/90"
                        : "bg-primary text-black hover:bg-primary/90"
                      : "bg-white/5 text-dark-subtext cursor-not-allowed"
                  }`}
                >
                  {savingAd
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />}
                  {editingId ? "UPDATE AD" : adType === "coming_soon" ? "SAVE COMING SOON" : "SAVE AD"}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setAdType("existing");
                      setComingSoonTitleEN("");
                      setComingSoonTitleAR("");
                      setForm({ mangaId: "", description: "", languages: [], hasHD: false });
                      setAdImageURL("");
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-dark-subtext hover:text-white transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Existing Ads Table ── */}
        <div className="bg-[#0B0B0E] rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">
              Existing Ads
              <span className="ml-2 text-xs text-dark-subtext font-normal">({ads.length} total)</span>
            </h3>
          </div>

          {loadingAds ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-dark-subtext gap-2">
              <ImageIcon className="w-8 h-8 opacity-30" />
              <p className="text-sm">No ads yet. Add one above.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                    {ad.imageURL ? (
                      <img src={ad.imageURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-dark-subtext/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">
                        {ad.titleEN || ad.mangaName || ad.mangaId}
                      </p>
                      {ad.isComingSoon && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFA500]/10 text-[#FFA500] border border-[#FFA500]/20 flex-shrink-0">
                          SOON
                        </span>
                      )}
                    </div>
                    {ad.description && (
                      <p className="text-xs text-dark-subtext mt-0.5 line-clamp-1">{ad.description}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {ad.languages?.includes("AR") && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">AR</span>
                    )}
                    {ad.languages?.includes("EN") && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">EN</span>
                    )}
                    {ad.hasHD && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">HD</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(ad.id);
                        setForm({
                          mangaId: ad.mangaId || "",
                          description: ad.description || "",
                          languages: ad.languages || [],
                          hasHD: !!ad.hasHD,
                        });
                        setAdType(ad.isComingSoon ? "coming_soon" : "existing");
                        if (ad.isComingSoon) {
                          setComingSoonTitleEN(ad.titleEN || "");
                          setComingSoonTitleAR(ad.titleAR || "");
                        }
                        if (ad.imageURL) setAdImageURL(ad.imageURL);
                        if (ad.imagePosition) setAdImagePosition(ad.imagePosition);
                        else setAdImagePosition({ x: 50, y: 50 });
                        
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      disabled={deletingId === ad.id}
                      className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === ad.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* ── Position Pickers ── */}
      {showLogoPicker && logoURL && (
        <ImagePositionPicker
          imageURL={logoURL}
          aspectRatio="square"
          onSave={(pos) => { setLogoPosition(pos); setShowLogoPicker(false); handleSaveLogo(); }}
          onCancel={() => setShowLogoPicker(false)}
          currentPosition={logoPosition}
        />
      )}
      {showLoginPicker && loginMediaURL && (
        <ImagePositionPicker
          imageURL={loginMediaURL}
          aspectRatio="banner"
          onSave={(pos) => { setLoginMediaPosition(pos); setShowLoginPicker(false); handleSaveLogin(); }}
          onCancel={() => setShowLoginPicker(false)}
          currentPosition={loginMediaPosition}
        />
      )}
      {showRegisterPicker && registerMediaURL && (
        <ImagePositionPicker
          imageURL={registerMediaURL}
          aspectRatio="banner"
          onSave={(pos) => { setRegisterMediaPosition(pos); setShowRegisterPicker(false); handleSaveRegister(); }}
          onCancel={() => setShowRegisterPicker(false)}
          currentPosition={registerMediaPosition}
        />
      )}
      {showAdBannerPicker && adBannerImageURL && (
        <ImagePositionPicker
          imageURL={adBannerImageURL}
          aspectRatio="banner"
          onSave={(pos) => { setAdBannerImagePosition(pos); setShowAdBannerPicker(false); handleSaveAdBanner(); }}
          onCancel={() => setShowAdBannerPicker(false)}
          currentPosition={adBannerImagePosition}
        />
      )}
      {showAdPicker && adImageURL && (
        <ImagePositionPicker
          imageURL={adImageURL}
          aspectRatio="banner"
          onSave={(pos) => { setAdImagePosition(pos); setShowAdPicker(false); }}
          onCancel={() => setShowAdPicker(false)}
          currentPosition={adImagePosition}
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
