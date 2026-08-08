export default function CaregiverEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
        ❤️
      </div>

      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        No caregivers available
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
        There are no active caregivers available right now. Please check
        again later.
      </p>
    </div>
  );
}
