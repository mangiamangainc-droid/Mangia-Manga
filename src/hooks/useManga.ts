"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Manga, MangaGenre, MangaStatus } from "@/types";
import { Collections } from "@/lib/firebase/firestore";

const DEMO_MANGA_DATA: Manga[] = [
  {
    id: "demo_1",
    nameEn: "Solo Leveling",
    nameAr: "سولو ليفلينج",
    descriptionEn: "In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, the weakest of them all, discovers a mysterious system that grants him the power to level up infinitely.",
    descriptionAr: "في عالم يجب على الصيادين فيه محاربة الوحوش القاتلة لحماية البشرية، يكتشف سونغ جين وو، الأضعف بينهم جميعًا، نظامًا غامضًا يمنحه القدرة على رفع مستواه بلا حدود.",
    bannerURL: "/images/placeholder-banner.svg",
    posterURL: "/images/placeholder-poster.svg",
    genres: ["action", "fantasy", "adventure"],
    status: "completed",
    totalSeasons: 2,
    totalChapters: 179,
    totalViews: 15400300,
    averageRating: 4.9,
    totalRatings: 345000,
    isFeatured: true,
    isPublished: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: "demo_2",
    nameEn: "One Piece",
    nameAr: "ون بيس",
    descriptionEn: "Follow the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.",
    descriptionAr: "اتبع مغامرات مونكي دي لوفي وطاقمه من القراصنة من أجل العثور على أعظم كنز تركه على الإطلاق القرصان الأسطوري، جولد روجر.",
    bannerURL: "/images/placeholder-banner.svg",
    posterURL: "/images/placeholder-poster.svg",
    genres: ["action", "adventure", "comedy"],
    status: "ongoing",
    totalSeasons: 20,
    totalChapters: 1100,
    totalViews: 95400300,
    averageRating: 4.8,
    totalRatings: 845000,
    isFeatured: true,
    isPublished: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: "demo_3",
    nameEn: "Jujutsu Kaisen",
    nameAr: "جوجوتسو كايسن",
    descriptionEn: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.",
    descriptionAr: "يبتلع صبي تعويذة ملعونة - إصبع شيطان - ويصبح ملعونًا بنفسه.",
    bannerURL: "/images/placeholder-banner.svg",
    posterURL: "/images/placeholder-poster.svg",
    genres: ["action", "supernatural", "horror"],
    status: "ongoing",
    totalSeasons: 4,
    totalChapters: 250,
    totalViews: 25400300,
    averageRating: 4.7,
    totalRatings: 245000,
    isFeatured: true,
    isPublished: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: "demo_4",
    nameEn: "Chainsaw Man",
    nameAr: "رجل المنشار",
    descriptionEn: "Following a betrayal, a young man left for dead is reborn as a powerful devil-human hybrid after merging with his pet devil.",
    descriptionAr: "بعد تعرضه للخيانة، يُترك شاب ليموت ويولد من جديد كهجين قوي من شيطان وإنسان بعد اندماجه مع شيطانه الأليف.",
    bannerURL: "/images/placeholder-banner.svg",
    posterURL: "/images/placeholder-poster.svg",
    genres: ["action", "horror", "comedy"],
    status: "ongoing",
    totalSeasons: 2,
    totalChapters: 150,
    totalViews: 18400300,
    averageRating: 4.6,
    totalRatings: 145000,
    isFeatured: false,
    isPublished: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: "demo_5",
    nameEn: "Demon Slayer",
    nameAr: "قاتل الشياطين",
    descriptionEn: "A young boy becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon.",
    descriptionAr: "يصبح صبي صغير قاتل شياطين بعد ذبح عائلته وتحول أخته الصغرى إلى شيطان.",
    bannerURL: "/images/placeholder-banner.svg",
    posterURL: "/images/placeholder-poster.svg",
    genres: ["action", "adventure", "supernatural"],
    status: "completed",
    totalSeasons: 4,
    totalChapters: 205,
    totalViews: 45400300,
    averageRating: 4.8,
    totalRatings: 445000,
    isFeatured: true,
    isPublished: true,
    createdAt: null as any,
    updatedAt: null as any,
  }
];

export function useManga(constraints: QueryConstraint[] = []) {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, Collections.MANGA),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Manga));
        if (results.length === 0) {
          results = DEMO_MANGA_DATA;
        }
        setManga(results);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { manga, loading, error };
}

export function useTrendingManga(count = 10) {
  return useManga([orderBy("totalViews", "desc"), limit(count)]);
}

export function useLatestManga(count = 12) {
  return useManga([orderBy("updatedAt", "desc"), limit(count)]);
}

export function useFeaturedManga() {
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, Collections.MANGA),
      orderBy("updatedAt", "desc"),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setManga({ id: snap.docs[0].id, ...snap.docs[0].data() } as Manga);
      } else {
        setManga(DEMO_MANGA_DATA[0]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { manga, loading };
}
