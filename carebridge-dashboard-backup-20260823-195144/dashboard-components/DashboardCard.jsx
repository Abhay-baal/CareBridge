export default function DashboardCard({
  title,
  value,
  icon,
  children,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
            {icon}
          </div>
        )}

        <h3 className="text-sm font-medium text-gray-600">
          {title}
        </h3>
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-900">
        {value}
      </p>

      {children}
    </div>
  );
}
