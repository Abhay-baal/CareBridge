export default function EmptyState({
  icon = "📄",
  title = "Nothing here yet",
  message = "There is no information to display.",
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 text-base font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        {message}
      </p>
    </div>
  );
}
