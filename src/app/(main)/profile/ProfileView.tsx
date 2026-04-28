"use client";

import { useAuthStore } from "@/store/authStore";
import { User, Shield, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProfileView() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="animate-pulse w-full h-64 bg-white/5 rounded-3xl" />;
  }

  const isAdmin = user.role === "admin";
  const isPremium = user.subscriptionStatus === "active";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#0B0B0E] p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-24 h-24 rounded-[24px] bg-gradient-to-br ${isAdmin ? 'from-purple-500/20 to-purple-500/5 border-purple-500/20' : isPremium ? 'from-primary/20 to-primary/5 border-primary/20' : 'from-white/10 to-white/5 border-white/10'} border flex items-center justify-center overflow-hidden shadow-xl`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className={`font-black text-4xl ${isAdmin ? 'text-purple-400' : isPremium ? 'text-primary' : 'text-white/50'}`}>
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-white">{user.displayName}</h1>
              {isAdmin && <Shield className="w-5 h-5 text-purple-400" />}
              {isPremium && !isAdmin && <Crown className="w-5 h-5 text-primary" />}
            </div>
            {user.username && (
              <p className="text-primary font-bold text-lg mb-2">@{user.username}</p>
            )}
            <p className="text-sm text-dark-subtext">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
