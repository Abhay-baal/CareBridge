export default function TodayTasks({ tasks = [], onToggle }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Today's Tasks</h2>
        <span className="text-sm text-gray-500">{tasks.length} Tasks</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks for today.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const completed = task.status === "completed";

            return (
              <button
                key={task._id}
                onClick={() => onToggle?.(task)}
                className="flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-left"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {completed ? "✓" : ""}
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
                    <p className="mt-1 text-xs text-gray-500">
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
