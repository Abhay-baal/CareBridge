export default function LoadingOverlay({
  show = false,
  message = "Please wait...",
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm font-medium text-gray-700">
          {message}
        </p>
      </div>
    </div>
  );
}
