"use client";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, linkWithCredential } from "firebase/auth";
import { db, auth } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ImagePositionPicker } from "@/components/ui/ImagePositionPicker";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isEmailUser, setIsEmailUser] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Media states
  const [avatarURL, setAvatarURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Position picker states
  const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50 });
  const [bannerPosition, setBannerPosition] = useState({ x: 50, y: 50 });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [tempAvatarURL, setTempAvatarURL] = useState("");
  const [tempBannerURL, setTempBannerURL] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);

  // Edit menu states
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Fetch profile data
  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfileData(data);
        setFirstName(data.firstName || "");
        setMiddleName(data.middleName || "");
        setLastName(data.lastName || "");
        setUsername(data.username || "");
        setEmail(data.email || user.email || "");
        setAvatarURL(data.photoURL || "");
        setBannerURL(data.bannerURL || "");
        setAvatarPosition(data.avatarPosition || { x: 50, y: 50 });
        setBannerPosition(data.bannerPosition || { x: 50, y: 50 });
      }

      // Check provider
      if (auth.currentUser) {
        setIsEmailUser(auth.currentUser.providerData.some(p => p.providerId === "password"));
      }

      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Upload avatar — show position picker first
  const handleAvatarUpload = async (file: File) => {
    const localURL = URL.createObjectURL(file);
    setTempAvatarURL(localURL);
    setPendingAvatarFile(file);
    setShowAvatarPicker(true);
  };

  const saveAvatarPosition = async (position: { x: number; y: number }) => {
    setShowAvatarPicker(false);
    setUploadingAvatar(true);
    try {
      let url = avatarURL;
      
      // Only upload if there's a new file
      if (pendingAvatarFile) {
        const uploadedURL = await uploadToCloudinary(pendingAvatarFile, "mangia/avatars");
        url = uploadedURL;
        // Update local store user only on new photo
        setUser({ ...user, photoURL: url });
      }

      const cacheBustURL = `${url}?t=${Date.now()}`;
      setAvatarURL(cacheBustURL);
      setAvatarPosition(position);
      await updateDoc(doc(db, "users", user!.uid), { photoURL: url, avatarPosition: position });
      
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Save avatar error:", err);
      toast.error("Update failed!");
    }
    setUploadingAvatar(false);
  };

  const handleRepositionAvatar = () => {
    if (!avatarURL) return;
    setTempAvatarURL(avatarURL);
    setPendingAvatarFile(null); // No new file, just updating position
    setShowAvatarPicker(true);
    setShowAvatarMenu(false);
  };

  // Upload banner — show position picker first
  const handleBannerUpload = async (file: File) => {
    const localURL = URL.createObjectURL(file);
    setTempBannerURL(localURL);
    setPendingBannerFile(file);
    setShowBannerPicker(true);
  };

  const saveBannerPosition = async (position: { x: number; y: number }) => {
    setShowBannerPicker(false);
    setUploadingBanner(true);
    try {
      let url = bannerURL;

      // Only upload if there's a new file
      if (pendingBannerFile) {
        const uploadedURL = await uploadToCloudinary(pendingBannerFile, "mangia/banners/users");
        url = uploadedURL;
      }

      const cacheBustURL = `${url}?t=${Date.now()}`;
      setBannerURL(cacheBustURL);
      setBannerPosition(position);
      await updateDoc(doc(db, "users", user!.uid), { bannerURL: url, bannerPosition: position });
      
      toast.success("Banner updated!");
    } catch (err) {
      console.error("Save banner error:", err);
      toast.error("Update failed!");
    }
    setUploadingBanner(false);
  };

  const handleRepositionBanner = () => {
    if (!bannerURL) return;
    setTempBannerURL(bannerURL);
    setPendingBannerFile(null); // No new file
    setShowBannerPicker(true);
    setShowBannerMenu(false);
  };

  // Save profile info
  const saveProfile = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        firstName,
        middleName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        username: username.toLowerCase(),
        updatedAt: new Date(),
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error("Failed to save!");
    }
    setSaving(false);
  };

  // Change password
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        toast.error("User email not found!");
        return;
      }

      // Check if user has a password provider
      const isEmailUser = currentUser.providerData.some(p => p.providerId === "password");
      if (!isEmailUser) {
        toast.error("You are signed in via a provider (like Google). You can only change your password through that provider.");
        return;
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(auth.currentUser!, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Change password error:", err);
      if (err.code === "auth/wrong-password") {
        toast.error("Current password is wrong!");
      } else {
        toast.error(`Failed: ${err.message || "Unknown error"}`);
      }
    }
  };

  // Set initial password for social users
  const setInitialPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        toast.error("Email not found!");
        return;
      }

      const credential = EmailAuthProvider.credential(currentUser.email, newPassword);
      await linkWithCredential(currentUser, credential);
      
      toast.success("Password created! You can now login with email or Google.");
      setIsEmailUser(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Set password error:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please logout and login again with Google to set a password.");
      } else {
        toast.error(`Failed: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="animate-spin w-10 h-10 text-primary" />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    color: "#666",
    display: "block",
    marginBottom: "6px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 0 60px" }}>

      {/* Position Pickers */}
      {showAvatarPicker && (
        <ImagePositionPicker
          imageURL={tempAvatarURL}
          aspectRatio="square"
          currentPosition={avatarPosition}
          onSave={saveAvatarPosition}
          onCancel={() => setShowAvatarPicker(false)}
        />
      )}
      {showBannerPicker && (
        <ImagePositionPicker
          imageURL={tempBannerURL}
          aspectRatio="banner"
          currentPosition={bannerPosition}
          onSave={saveBannerPosition}
          onCancel={() => setShowBannerPicker(false)}
        />
      )}

      {/* BANNER */}
      <div
        style={{
          width: "100%",
          height: "220px",
          background: "linear-gradient(135deg, #0d1f0f 0%, #1a1a1a 100%)",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {bannerURL ? (
          <img
            src={bannerURL}
            alt="Banner"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${bannerPosition.x}% ${bannerPosition.y}%`,
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ color: "#444", fontSize: "0.85rem" }}>Upload a banner</span>
          </div>
        )}

        {/* Edit Banner Button — top right */}
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          <button
            onClick={() => setShowBannerMenu(!showBannerMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              padding: "7px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            {uploadingBanner ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
            {uploadingBanner ? "Uploading..." : "Edit Banner"}
          </button>

          {showBannerMenu && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "6px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", overflow: "hidden", zIndex: 100, width: "160px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              <button 
                onClick={() => { bannerRef.current?.click(); setShowBannerMenu(false); }}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#fff", padding: "10px 14px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = "#222"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Change Photo
              </button>
              <button 
                onClick={handleRepositionBanner}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#fff", padding: "10px 14px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500, borderTop: "1px solid #222" }}
                onMouseEnter={e => e.currentTarget.style.background = "#222"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Reposition
              </button>
            </div>
          )}
        </div>

        <input
          ref={bannerRef}
          type="file"
          accept="image/*,image/gif"
          style={{ display: "none" }}
          onChange={e => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
        />
      </div>

      {/* AVATAR + NAME ROW */}
      <div style={{ padding: "0 24px", marginTop: "-50px", display: "flex", alignItems: "flex-end", gap: "16px", marginBottom: "28px" }}>
        {/* Avatar wrapper with edit button below */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div
            style={{
              width: "100px", height: "100px",
              borderRadius: "50%",
              border: "4px solid #0a0a0a",
              background: "#1a1a1a",
              overflow: "hidden",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {avatarURL ? (
              <img
                src={avatarURL}
                alt="Avatar"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#01FF48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#000", fontWeight: 900, fontSize: "2.2rem" }}>
                  {firstName?.[0] || username?.[0] || user?.displayName?.[0] || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Edit Avatar Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#aaa",
                padding: "5px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              {uploadingAvatar ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
              {uploadingAvatar ? "..." : "Edit"}
            </button>

            {showAvatarMenu && (
              <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "6px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", overflow: "hidden", zIndex: 100, width: "140px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                <button 
                  onClick={() => { avatarRef.current?.click(); setShowAvatarMenu(false); }}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#fff", padding: "10px 14px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#222"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  Change Photo
                </button>
                <button 
                  onClick={handleRepositionAvatar}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "#fff", padding: "10px 14px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500, borderTop: "1px solid #222" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#222"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  Reposition
                </button>
              </div>
            )}
          </div>

          <input
            ref={avatarRef}
            type="file"
            accept="image/*,image/gif"
            style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
          />
        </div>

        <div style={{ paddingBottom: "8px" }}>
          <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>
            {firstName ? `${firstName} ${lastName}`.trim() : (profileData?.displayName || "Your Name")}
          </div>
          <div style={{ color: "#01FF48", fontSize: "0.85rem", fontWeight: 600 }}>@{username || "username"}</div>
          <div style={{ color: "#555", fontSize: "0.78rem", marginTop: "2px" }}>{email}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #222", marginBottom: "28px" }}>
          {[
            { key: "info", label: "Personal Info" },
            { key: "security", label: "Security" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #01FF48" : "2px solid transparent",
                color: activeTab === tab.key ? "#01FF48" : "#666",
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                fontFamily: "inherit",
                marginBottom: "-1px",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PERSONAL INFO TAB */}
        {activeTab === "info" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Middle Name</label>
                <input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="(optional)" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              <div>
                <label style={labelStyle}>Username</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: 700 }}>@</span>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="username"
                    style={{ ...inputStyle, paddingLeft: "28px" }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  value={email}
                  disabled
                  style={{ ...inputStyle, background: "#111", color: "#555", cursor: "not-allowed", border: "1px solid #1a1a1a" }}
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                background: "#01FF48",
                border: "none",
                color: "#000",
                padding: "10px 28px",
                borderRadius: "8px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div style={{ maxWidth: "420px" }}>
            {!isEmailUser ? (
              <div>
                <div style={{ padding: "24px", background: "rgba(1,255,72,0.05)", borderRadius: "12px", border: "1px solid rgba(1,255,72,0.1)", marginBottom: "24px" }}>
                  <h3 style={{ fontWeight: 800, marginBottom: "12px", color: "#fff", fontSize: "1.1rem" }}>Create Password</h3>
                  <p style={{ color: "#888", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    You are currently using Google/Facebook. 
                    Set a password to also be able to login with your email directly.
                  </p>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>NEW PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>CONFIRM PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={setInitialPassword}
                  disabled={saving}
                  style={{
                    background: "#01FF48",
                    border: "none",
                    color: "#000",
                    padding: "10px 28px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Password
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontWeight: 800, marginBottom: "20px", color: "#fff", fontSize: "1.1rem" }}>Change Password</h3>
                
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>Current Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>Confirm New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={changePassword}
                  style={{
                    background: "#01FF48",
                    border: "none",
                    color: "#000",
                    padding: "10px 28px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  Change Password
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
