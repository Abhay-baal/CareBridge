export default function ParentSummaryCard({ parent }) {
  if (!parent) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Parent information unavailable.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
          {parent.fullName?.charAt(0)?.toUpperCase() || "P"}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {parent.fullName || "Parent"}
          </h2>
          <p className="text-sm text-gray-500">
            Blood Group: {parent.bloodGroup || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <p className="text-xs text-gray-500">Health Status</p>
        <p className="mt-1 font-medium text-gray-900">
          {parent.healthStatus || "Good"}
        </p>
      </div>
    </div>
  );
}
