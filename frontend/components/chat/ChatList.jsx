export default function ChatList({
  messages = [],
  userId,
}) {
  if (!messages.length) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((item) => {
        const mine =
          item.sender?._id === userId;

        return (
          <div
            key={item._id}
            className={`flex ${
              mine
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                mine
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">
                {item.message}
              </p>

              <p className="mt-1 text-[10px] opacity-70">
                {new Date(
                  item.createdAt
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
