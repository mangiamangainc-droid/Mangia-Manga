import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function MangaCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-44", md: "h-60", lg: "h-72" };
  const widths = { sm: "w-32", md: "w-44", lg: "w-52" };

  return (
    <div className={cn("flex-shrink-0", widths[size])}>
      <Skeleton className={cn("w-full rounded-xl", heights[size])} />
      <Skeleton className="h-4 w-3/4 mt-2 rounded" />
      <Skeleton className="h-3 w-1/3 mt-1.5 rounded" />
    </div>
  );
}

export function MangaRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6">
      <Skeleton className="h-4 w-24 rounded mb-4" />
      <Skeleton className="h-8 w-32 rounded mb-2" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}
