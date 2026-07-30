export default function ContactCard({
  contact,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {contact.name}
          </h3>

          <p className="text-sm text-gray-500">
            {contact.relation || "Contact"}
          </p>

          <p className="mt-1 text-sm text-gray-700">
            {contact.phone}
          </p>
        </div>

        <a
          href={`tel:${contact.phone}`}
          className="rounded-xl bg-green-100 px-3 py-2 text-sm font-medium text-green-700"
        >
          Call
        </a>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit?.(contact)}
          className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete?.(contact._id)}
          className="flex-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
