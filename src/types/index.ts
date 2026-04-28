import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────
export type UserRole = "user" | "admin";
export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "trialing";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  fcmToken?: string;
  preferredLanguage: "en" | "ar";
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlanId?: string;
  stripeCustomerId?: string;
  subscriptionEndDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Manga ───────────────────────────────────────────────────────────
export type MangaStatus = "ongoing" | "completed" | "hiatus";
export type MangaGenre =
  | "action"
  | "adventure"
  | "comedy"
  | "drama"
  | "fantasy"
  | "horror"
  | "mystery"
  | "romance"
  | "sci-fi"
  | "slice-of-life"
  | "sports"
  | "supernatural";

export interface Manga {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  bannerURL: string;       // 1920×600px
  bannerPosition?: { x: number; y: number };
  posterURL: string;       // 460×650px
  posterPosition?: { x: number; y: number };
  genres: MangaGenre[];
  status: MangaStatus;
  totalSeasons: number;
  totalChapters: number;
  totalViews: number;
  averageRating: number;
  totalRatings: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Season ──────────────────────────────────────────────────────────
export interface Season {
  id: string;
  mangaId: string;
  nameEn: string;
  nameAr: string;
  posterURL: string;       // 460×650px
  posterPosition?: { x: number; y: number };
  seasonNumber: number;
  totalChapters: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Chapter ─────────────────────────────────────────────────────────
export type ChapterSourceType = "images" | "pdf" | "gdrive";

export interface Chapter {
  id: string;
  mangaId: string;
  seasonId: string;
  titleEn: string;
  titleAr: string;
  chapterNumber: number;
  sourceType: ChapterSourceType;
  pageURLs?: string[];        // for images
  pdfURL?: string;            // for PDF upload
  gDriveLink?: string;        // for Google Drive link
  isFree: boolean;            // true = ad-gated; false = premium only
  isPublished: boolean;
  totalViews: number;
  totalLikes: number;
  notificationSent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Comment ─────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  chapterId: string;
  mangaId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;
  likes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Rating ──────────────────────────────────────────────────────────
export interface Rating {
  id: string;         // userId_chapterId
  chapterId: string;
  mangaId: string;
  userId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  createdAt: Timestamp;
}

// ─── Reading Progress ────────────────────────────────────────────────
export interface ReadingProgress {
  id: string;         // userId_chapterId
  userId: string;
  mangaId: string;
  chapterId: string;
  lastPageIndex: number;
  totalPages: number;
  completed: boolean;
  lastReadAt: Timestamp;
}

// ─── Subscription Plan ───────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  stripePriceId: string;
  stripeProductId: string;
  featuresEn: string[];
  featuresAr: string[];
  isActive: boolean;
  isPopular: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Ad ──────────────────────────────────────────────────────────────
export type AdType = "banner" | "interstitial" | "video";
export type AdPlacement = "before_chapter" | "homepage" | "reader";

export interface Ad {
  id: string;
  nameEn: string;
  nameAr: string;
  imageURL: string;
  linkURL: string;
  type: AdType;
  placement: AdPlacement;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Notification ────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  mangaId?: string;
  chapterId?: string;
  imageURL?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ─── App Settings ────────────────────────────────────────────────────
export interface AppSettings {
  loginImageURL: string;     // 800×900px
  maintenanceMode: boolean;
  defaultLanguage: "en" | "ar";
  updatedAt: Timestamp;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────
export interface DashboardStats {
  totalReaders: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalManga: number;
  totalChapters: number;
  totalViews: number;
  newUsersToday: number;
  newUsersThisMonth: number;
}
