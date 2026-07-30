export default function StatsGrid({
  totalTasks = 0,
  completedTasks = 0,
  appointments = 0,
  reports = 0,
}) {
  const stats = [
    ["Total Tasks", totalTasks],
    ["Completed", completedTasks],
    ["Appointments", appointments],
    ["Health Reports", reports],
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl bg-white p-4 shadow-sm"
        >
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
