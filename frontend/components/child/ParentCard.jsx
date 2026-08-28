"use client";

export default function ParentCard({
  relationship,
  onSwitch,
  onRemove,
  switching,
  removing,
}) {
  const parent = relationship?.parent;

  return (
    <div
      className={`motion-card rounded-2xl border bg-white p-5 shadow-sm ${
        relationship?.active
          ? "border-blue-500 ring-1 ring-blue-100"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
            👤
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              {parent?.fullName || "Parent"}
            </h2>

            <p className="text-sm text-gray-500">
              {parent?.email || "No email"}
            </p>
          </div>
        </div>

        {relationship?.active && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Phone</span>
          <span className="font-medium text-gray-800">
            {parent?.phone || "Not provided"}
          </span>
        </div>


      </div>

      <div className="mt-4 flex gap-2">
        {!relationship?.active && (
          <button
            type="button"
            onClick={() => onSwitch(relationship._id)}
            disabled={switching}
            className="motion-press flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {switching ? "Switching..." : "Set Active"}
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(relationship._id)}
          disabled={removing}
          className={`motion-press rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 ${
            relationship?.active ? "flex-1" : ""
          }`}
        >
          {removing ? "Removing..." : "Remove"}
        </button>
      </div>
    </div>
  );
}
