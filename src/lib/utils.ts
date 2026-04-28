import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind class merger ────────────────────────────────────────────
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ─── Format numbers ───────────────────────────────────────────────────
export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// ─── Format currency ──────────────────────────────────────────────────
export const formatCurrency = (amount: number, currency = "USD", locale = "en-US") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

// ─── Truncate text ────────────────────────────────────────────────────
export const truncate = (str: string, maxLength: number) =>
  str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;

// ─── Generate reading progress percentage ─────────────────────────────
export const getReadingPercent = (current: number, total: number) =>
  total > 0 ? Math.round((current / total) * 100) : 0;

// ─── Google Drive embed URL ───────────────────────────────────────────
export const getGDriveEmbedURL = (driveLink: string): string => {
  const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return driveLink;
};

// ─── Debounce ─────────────────────────────────────────────────────────
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
