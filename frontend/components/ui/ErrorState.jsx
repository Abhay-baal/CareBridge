export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}) {
  return (
    <div className="rounded-2xl bg-red-50 p-5 text-center">
      <p className="font-medium text-red-700">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
