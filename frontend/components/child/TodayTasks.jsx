export default function TodayTasks({
  tasks = [],
  onToggle,
}) {
  return (
    <div className="motion-card rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Today&apos;s Tasks
        </h2>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
          {tasks.length} Tasks
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="py-4 text-center">
          <div className="text-2xl">✅</div>

          <p className="mt-2 text-sm font-medium text-gray-700">
            No tasks for today
          </p>

          <p className="mt-1 text-xs text-gray-500">
            You&apos;re all caught up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const completed = task.status === "completed";

            return (
              <button
                key={task._id}
                type="button"
                onClick={() => onToggle?.(task)}
                className="motion-press flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:bg-gray-100 hover:shadow-sm"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${
                      completed
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </p>

                  {task.description && (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {task.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
