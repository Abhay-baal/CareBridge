export default function UploadPlaceholder() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
        +
      </div>

      <h3 className="font-semibold text-gray-900">
        Upload Medical Record
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Upload functionality will be available soon.
      </p>

      <p className="mt-3 text-xs text-gray-400">
        Supported formats: PDF, JPG, PNG
      </p>

      <button
        type="button"
        disabled
        className="mt-4 rounded-xl bg-gray-100 px-5 py-2 text-sm font-medium text-gray-400"
      >
        Upload Record
      </button>
    </div>
  );
}
