export default function ProgressCard({ completed = 0, total = 0 }) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Today's Progress</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {progress}%
          </h2>
        </div>

        <div className="text-sm text-gray-500">
          {completed}/{total} tasks
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
