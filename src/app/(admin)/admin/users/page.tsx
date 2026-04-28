"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Shield, Ban, UserCheck, Mail, Calendar, Key, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { doc, updateDoc, query, collection, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import toast from "react-hot-toast";

const getInitials = (name: string) => {
  return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
};

export default function UsersManagementPage() {
  const { users, loading: usersLoading } = useUsers();
  const [activeSubs, setActiveSubs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Active Subscriptions to show PREMIUM badge
  useEffect(() => {
    const q = query(collection(db, "subscriptions"), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(d => d.data().userId));
      setActiveSubs(ids);
    });
    return () => unsub();
  }, []);

  // 2. Promote / Demote Admin
  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const isPromoting = currentRole !== "admin";
    if (!confirm(isPromoting ? "Promote this user to Admin?" : "Remove admin role from this user?")) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, Collections.USERS, userId), {
        role: isPromoting ? "admin" : "user"
      });

      // Optional: Call API to set custom claims if implemented
      try {
        await fetch("/api/auth/set-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, isAdmin: isPromoting })
        });
      } catch (e) { console.warn("Custom claims API failed, but Firestore updated."); }

      toast.success(isPromoting ? "User promoted to Admin!" : "Admin role removed!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Ban / Unban
  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    if (!confirm(isBanned ? "Unban this user?" : "Are you sure you want to BAN this user?")) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, Collections.USERS, userId), {
        banned: !isBanned,
        bannedAt: !isBanned ? new Date() : null,
      });
      toast.success(isBanned ? "User unbanned!" : "User banned!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password
  const handleResetPassword = async (email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    
    setLoading(true);
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      toast.success("Password reset email sent!");
    } catch (e: any) {
      toast.error("Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || 
                          u.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Users Management</h1>
        <p className="text-dark-subtext mt-1 font-medium">Control permissions, manage subscriptions, and secure the platform.</p>
      </div>

      <div className="bg-[#0B0B0E] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 bg-black/20">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-subtext" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-sm text-white focus:outline-none focus:border-primary/50 font-bold uppercase tracking-widest"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Regular Users</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-black/40 text-[10px] font-black uppercase tracking-[0.2em] text-dark-subtext border-b border-white/5">
                <th className="px-8 py-5">User Identity</th>
                <th className="px-8 py-5">Access Level</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Joined Date</th>
                <th className="px-8 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u: any) => {
                const isPremium = activeSubs.has(u.id);
                const isBanned = u.banned === true;
                const isAdmin = u.role === 'admin';

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div style={{
                          width: "48px", height: "48px",
                          borderRadius: "16px",
                          background: u.photoURL ? "transparent" : (isAdmin ? "rgba(168,85,247,0.2)" : "#01FF48"),
                          border: isAdmin ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(1,255,72,0.3)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement!.style.background = isAdmin ? "rgba(168,85,247,0.2)" : "#01FF48";
                                e.currentTarget.parentElement!.innerHTML = `<span style="color:${isAdmin ? '#a855f7' : '#000'};font-weight:900;font-size:1.1rem">${getInitials(u.displayName || u.email)}</span>`;
                              }}
                            />
                          ) : (
                            <span style={{ color: isAdmin ? '#a855f7' : '#000', fontWeight: 900, fontSize: "1.1rem" }}>
                              {getInitials(u.displayName || u.email)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-white text-base leading-none mb-1">{u.displayName || 'Anonymous User'}</p>
                          <p className="text-xs text-dark-subtext flex items-center gap-1.5 font-medium italic">
                            <Mail className="w-3 h-3 text-dark-muted" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        isAdmin 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {u.role}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        isBanned 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                          : isAdmin
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : isPremium
                              ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(1,255,72,0.1)]' 
                              : 'bg-white/5 text-dark-subtext border-white/10'
                      }`}>
                        {isBanned ? 'BANNED' : isAdmin ? 'ADMIN' : isPremium ? 'PREMIUM' : 'FREE'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-dark-subtext flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-dark-muted" />
                        {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleAdmin(u.id, u.role)}
                          className={`p-2.5 rounded-xl border transition-all ${isAdmin ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-purple-400 hover:border-purple-500/30'}`}
                          title={isAdmin ? "Demote to User" : "Promote to Admin"}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(u.email)}
                          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-yellow-500 hover:border-yellow-500/30 transition-all"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleBan(u.id, isBanned)}
                          className={`p-2.5 border rounded-xl transition-all ${
                            isBanned 
                              ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-red-500 hover:text-white hover:border-red-500'
                          }`}
                          title={isBanned ? "Unban User" : "Ban User"}
                        >
                          {isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && !usersLoading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-dark-muted">
                      <ShieldAlert className="w-12 h-12 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">No matching users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-dark-card p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-xs font-black text-white uppercase tracking-widest">Processing Command...</p>
          </div>
        </div>
      )}
    </div>
  );
}
