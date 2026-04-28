"use client";

import Link from "next/link";
import { BookOpen, Github, Twitter, Instagram } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { t } from "@/lib/i18n/translations";
import { useLogo } from "@/hooks/useLogo";

export function Footer() {
  const { locale } = useUIStore();
  const logoURL = useLogo();
  const year = new Date().getFullYear();

  const links = {
    explore: [
      { href: "/", label: t("nav.home", locale) },
      { href: "/library", label: t("nav.library", locale) },
      { href: "/plans", label: t("nav.plans", locale) },
    ],
    account: [
      { href: "/login", label: t("nav.login", locale) },
      { href: "/register", label: t("nav.register", locale) },
      { href: "/profile", label: t("nav.profile", locale) },
    ],
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {logoURL ? (
                <img src={logoURL} alt="MANGIA" style={{ height: "40px", objectFit: "contain" }} />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-dark-bg" />
                  </div>
                  <span className="text-xl font-black text-[var(--text)]">
                    MAN<span className="text-primary">GIA</span>
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm text-[var(--subtext)] leading-relaxed max-w-xs">
              Your ultimate manga reading platform with thousands of titles
              available in Arabic and English.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--subtext)] hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text)] mb-4 uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2">
              {links.explore.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--subtext)] hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text)] mb-4 uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2">
              {links.account.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--subtext)] hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--subtext)]">
            © {year} MANGIA. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-[var(--subtext)] hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
