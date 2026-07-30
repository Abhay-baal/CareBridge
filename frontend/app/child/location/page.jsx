"use client";

export default function ChildLocationPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          Parent Location
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Current parent location.
        </p>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Current Address</p>
            <p className="mt-2 font-medium text-gray-900">
              Location data will appear here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="mt-2 font-medium text-gray-900">N/A</p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="mt-2 font-medium text-gray-900">N/A</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
