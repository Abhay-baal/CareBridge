export default function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Logging in..." : children}
    </button>
  );
}