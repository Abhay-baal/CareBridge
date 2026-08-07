"use client";

import { useState } from "react";

export default function MessageInput({
  onSend,
  disabled = false,
}) {
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!value.trim()) return;

    onSend(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={submit}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) =>
          setValue(e.target.value)
        }
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-full border px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-blue-600 px-5 text-white disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
