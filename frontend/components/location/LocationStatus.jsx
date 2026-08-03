export default function LocationStatus({
  sharing,
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        sharing
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {sharing
        ? "● Location sharing is active"
        : "○ Location sharing is off"}
    </div>
  );
}
