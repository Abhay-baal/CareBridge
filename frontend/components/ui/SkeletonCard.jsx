export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-1/2 rounded bg-gray-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-3 h-4 rounded bg-gray-100"
        />
      ))}
    </div>
  );
}
