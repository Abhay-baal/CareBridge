export default function EmptyState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center text-center">
      <div>
        <div className="mb-3 text-4xl">💬</div>
        <h2 className="font-semibold">
          No messages yet
        </h2>
        <p className="text-sm text-gray-500">
          Start the conversation.
        </p>
      </div>
    </div>
  );
}
