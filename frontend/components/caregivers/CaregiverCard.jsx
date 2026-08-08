"use client";

import Link from "next/link";

export default function CaregiverCard({ caregiver }) {
  const isAvailable = caregiver.availability === true;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {caregiver.name}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {caregiver.experience || 0} years experience
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isAvailable
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      {caregiver.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
          {caregiver.bio}
        </p>
      )}

      {caregiver.services?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {caregiver.services.map((service) => (
            <span
              key={service}
              className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {service}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <Link
          href={`/child/caregivers/${caregiver._id}`}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View Profile
        </Link>

        <button
          type="button"
          disabled={!isAvailable}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition ${
            isAvailable
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          Request Care
        </button>
      </div>
    </div>
  );
}
