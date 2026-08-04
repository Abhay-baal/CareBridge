export default function StatusBadge({ status }) {
  const value = String(status || "UNKNOWN").toUpperCase();

  const styles = {
    ACTIVE: "bg-red-100 text-red-700",
    ACKNOWLEDGED: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-gray-100 text-gray-600",
    UNKNOWN: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[value] || styles.UNKNOWN
      }`}
    >
      {value}
    </span>
  );
}
