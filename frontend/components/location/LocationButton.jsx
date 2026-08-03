export default function LocationButton({
  sharing,
  onStart,
  onStop,
  disabled,
}) {
  return (
    <button
      onClick={sharing ? onStop : onStart}
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3 font-medium text-white disabled:opacity-50 ${
        sharing
          ? "bg-red-600"
          : "bg-blue-600"
      }`}
    >
      {sharing
        ? "Stop Sharing"
        : "Start Sharing"}
    </button>
  );
}
