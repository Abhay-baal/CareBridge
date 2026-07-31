export default function StatsGrid({
  totalTasks = 0,
  completedTasks = 0,
  appointments = 0,
  reports = 0,
}) {
  const stats = [
    ["📋", "Total Tasks", totalTasks],
    ["✅", "Completed", completedTasks],
    ["📅", "Appointments", appointments],
    ["📄", "Health Reports", reports],
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(([icon, label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <p className="text-xs font-medium text-gray-500">
              {label}
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
