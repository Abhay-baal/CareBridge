import { Phone, Pencil, Trash2 } from "lucide-react";

export default function EmergencyContactCard({
  contact,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg">
            🚨
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

        <a
          href={`tel:${contact.phone}`}
          aria-label={`Call ${contact.name}`}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <Phone size={17} />
          Call
        </a>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">
          {contact.phone}
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit?.(contact)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(contact._id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
