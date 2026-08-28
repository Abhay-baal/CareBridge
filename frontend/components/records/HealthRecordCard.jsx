export default function HealthRecordCard({ record }) {
  return (
    <div className="motion-card flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-gray-900">
          {record.title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {record.type}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Uploaded{" "}
          {record.createdAt
            ? new Date(record.createdAt).toLocaleDateString("en-IN")
            : "Recently"}
        </p>
      </div>

      <button
        type="button"
        className="motion-press rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
      >
        View
      </button>
    </div>
  );
}
