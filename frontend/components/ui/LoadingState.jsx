export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
