export const LoadingSkeleton = () => (
  <div className="space-y-3">
    <div className="h-6 w-32 animate-pulse rounded bg-white/10"></div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5"></div>
      ))}
    </div>
  </div>
);
