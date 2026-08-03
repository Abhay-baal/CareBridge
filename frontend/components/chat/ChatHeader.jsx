"use client";

export default function ChatHeader({ name = "CareBridge" }) {
  return (
    <div className="border-b bg-white px-4 py-4">
      <h1 className="font-semibold text-gray-900">
        {name}
      </h1>
      <p className="text-xs text-green-600">
        Connected
      </p>
    </div>
  );
}
