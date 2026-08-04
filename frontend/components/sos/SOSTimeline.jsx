"use client";

import StatusBadge from "@/components/ui/StatusBadge";

export default function SOSTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          No emergency events yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event._id}
          className="rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                SOS Emergency
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {event.message || "Emergency alert triggered"}
              </p>
            </div>

            <StatusBadge status={event.status} />
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {event.address || "Location unavailable"}
          </div>

          {event.createdAt && (
            <div className="mt-1 text-xs text-gray-400">
              {new Date(event.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
