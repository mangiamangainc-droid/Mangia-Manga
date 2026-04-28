"use client";

import { useState } from "react";
import { doc, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  uid: string;
  onSuccess: () => void;
}

export function UsernameModal({ uid, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string) => {
    const regex = /^[a-zA-Z0-9_]+$/;
    if (value.length < 3 || value.length > 20) return false;
    if (!regex.test(value)) return false;
    const reserved = ["admin", "mangia", "root", "moderator"];
    if (reserved.includes(value.toLowerCase())) return false;
    return true;
  };

  const checkUsername = async (value: string) => {
    setUsername(value);
    
    if (value.length === 0) {
      setStatus("idle");
      return;
    }

    if (!validateUsername(value)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const snap = await getDoc(doc(db, "usernames", value.toLowerCase()));
    setStatus(snap.exists() ? "taken" : "available");
  };

  const handleSave = async () => {
    if (status !== "available") return;
    setLoading(true);
    try {
      const lowerUsername = username.toLowerCase();
      // Double check availability
      const snap = await getDoc(doc(db, "usernames", lowerUsername));
      if (snap.exists()) {
        setStatus("taken");
        toast.error("Username taken!");
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "usernames", lowerUsername), { uid });
      await updateDoc(doc(db, "users", uid), {
        username: lowerUsername,
        needsUsername: deleteField()
      });
      toast.success("Username set successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to set username.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Choose a Username</h2>
          <p className="text-sm text-dark-subtext mt-2 font-medium">This is how you'll appear to other readers.</p>
        </div>

        <div>
          <label className="block text-sm font-black text-white uppercase tracking-widest mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-subtext font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="manga_fan"
              className="w-full bg-black border border-white/10 rounded-2xl pl-10 pr-10 py-4 text-white placeholder:text-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-bold"
              maxLength={20}
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {status === "checking" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {status === "available" && <CheckCircle className="w-5 h-5 text-primary drop-shadow-[0_0_5px_rgba(1,255,72,0.5)]" />}
              {(status === "taken" || status === "invalid") && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
          </div>
          
          <div className="mt-3 text-xs font-bold">
            {status === "idle" && <p className="text-dark-muted">Letters, numbers, underscores (3-20 chars).</p>}
            {status === "checking" && <p className="text-primary/70 animate-pulse">Checking availability...</p>}
            {status === "available" && <p className="text-primary">Username is available!</p>}
            {status === "taken" && <p className="text-red-500">Username is already taken.</p>}
            {status === "invalid" && <p className="text-red-500">Invalid format or reserved word.</p>}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || status !== "available"}
          className="w-full btn-primary py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-widest text-sm"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}
