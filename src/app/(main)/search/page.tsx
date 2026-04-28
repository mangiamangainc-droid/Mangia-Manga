"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    const search = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "manga"));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      const filtered = all.filter(m => {
        const searchIn = [
          m.nameEn, m.nameAr, 
          m.titleEN, m.titleAR, m.nameEN, m.nameAR,
          m.name, m.title
        ].filter(Boolean).join(" ").toLowerCase();
        return searchIn.includes(query.toLowerCase());
      });

      setResults(filtered);
      setLoading(false);
    };
    search();
  }, [query]);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
          Search Results
        </h1>
        <p style={{ color: "#888", marginTop: "4px" }}>
          {loading ? "Searching..." : `${results.length} results for "${query}"`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ background: "#1a1a1a", borderRadius: "12px", aspectRatio: "3/4", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ fontWeight: 700, marginBottom: "8px", color: "#fff" }}>No manga found</h2>
          <p style={{ color: "#888" }}>Try searching with different keywords</p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "20px",
              background: "#01FF48",
              color: "#000",
              border: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "16px",
        }}>
          {results.map(manga => (
            <div
              key={manga.id}
              onClick={() => router.push(`/manga/${manga.id}`)}
              style={{ cursor: "pointer" }}
            >
              {/* Poster */}
              <div style={{
                width: "100%",
                paddingBottom: "133%",
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#1a1a1a",
                marginBottom: "8px",
              }}>
                <img
                  src={manga.posterURL}
                  alt={manga.titleEN}
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Status badge */}
                <div style={{
                  position: "absolute",
                  top: "8px", right: "8px",
                  background: "#01FF48",
                  color: "#000",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}>
                  {manga.status || "Ongoing"}
                </div>
              </div>
              {/* Title */}
              <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>
                {manga.nameEn || manga.titleEN || manga.nameEN || manga.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>
                {manga.nameAr || manga.titleAR || manga.nameAR}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
