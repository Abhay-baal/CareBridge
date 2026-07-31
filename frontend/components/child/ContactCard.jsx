export default function ContactCard({
  contact,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
              👤
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900">
                {contact.name}
              </h3>

              <p className="text-sm text-gray-500">
                {contact.relation || "Emergency Contact"}
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
            📞 {contact.phone}
          </p>
        </div>

        <a
          href={`tel:${contact.phone}`}
          className="shrink-0 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
        >
          Call
        </a>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit?.(contact)}
          className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(contact._id)}
          className="flex-1 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
