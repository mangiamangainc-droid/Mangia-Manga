"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  Image as ImageIcon,
  CreditCard,
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { useLogo } from "@/hooks/useLogo";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/manga", label: "Manga", icon: BookOpen },
  { href: "/admin/seasons", label: "Seasons & Chapters", icon: Layers },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ads", label: "Advertisements", icon: ImageIcon },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logoURL = useLogo();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0B0B0E] border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          {logoURL ? (
            <>
              <img src={logoURL} alt="MANGIA" style={{ height: "36px", objectFit: "contain" }} />
              <span className="text-xs font-medium text-dark-subtext uppercase tracking-widest">Admin</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                MAN<span className="text-primary">GIA</span> <span className="text-xs font-medium text-dark-subtext uppercase tracking-widest ml-1">Admin</span>
              </span>
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                isActive ? "text-primary bg-primary/10" : "text-dark-subtext hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-dark-subtext group-hover:text-white")} />
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full glow-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 relative overflow-hidden group mb-4">
          <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-bold text-white">Pro Features Active</span>
            <span className="text-xs text-dark-subtext">Master Admin Access</span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-dark-subtext hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Exit Admin
        </Link>
      </div>
    </aside>
  );
}
