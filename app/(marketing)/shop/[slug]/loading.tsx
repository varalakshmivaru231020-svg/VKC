export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>
      <div className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 w-48 rounded shimmer" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-[3/4] rounded-sm shimmer" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-7 w-3/4 rounded shimmer" />
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-8 w-40 rounded shimmer" />
          <div className="h-11 w-full rounded-sm shimmer mt-6" />
          <div className="h-11 w-full rounded-sm shimmer" />
        </div>
      </div>
    </div>
  );
}
