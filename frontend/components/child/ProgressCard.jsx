export default function ProgressCard({
  completed = 0,
  total = 0,
}) {
  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Today&apos;s Progress
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {progress}%
          </h2>
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500">
          {completed}/{total} tasks
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
