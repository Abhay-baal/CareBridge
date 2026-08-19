import { Phone, Pencil, Trash2 } from "lucide-react";

export default function EmergencyContactCard({
  contact,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const phone = contact?.phone || "";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
              👤
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900">
                {contact?.name || "Emergency Contact"}
              </h3>

              <p className="text-sm text-gray-500">
                {contact?.relation || "Emergency Contact"}
              </p>
            </div>
          </div>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-green-700"
            >
              <Phone size={16} className="text-green-600" />
              <span>{phone}</span>
            </a>
          )}
        </div>

        {phone && (
          <a
            href={`tel:${phone}`}
            aria-label={`Call ${contact?.name || "emergency contact"}`}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 active:scale-95"
          >
            <Phone size={16} />
            Call
          </a>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit?.(contact)}
          disabled={deleting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(contact?._id)}
          disabled={deleting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />

          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
