export default function DashboardCard({
  title,
  value,
  icon,
  children,
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-xl">
            {icon}
          </div>
        )}

        <h3 className="text-sm font-medium text-gray-700">
          {title}
        </h3>
      </div>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>

      {children}
    </div>
  );
}