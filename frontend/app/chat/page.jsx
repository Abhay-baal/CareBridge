"use client";

import { useEffect, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

const apiRequest = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};

const ChatHeader = ({ parent, role }) => {
  const backPath = role === "child" ? "/child/dashboard" : "/dashboard";

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <button
          type="button"
          onClick={() => {
            window.location.href = backPath;
          }}
          className="group flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:translate-y-0"
          aria-label="Back to dashboard"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </span>

          <span className="hidden sm:inline">
            Dashboard
          </span>
        </button>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
          {parent?.fullName?.charAt(0)?.toUpperCase() || "C"}
        </div>

        <div>
          <h1 className="font-semibold text-gray-900">
            {parent?.fullName || "CareBridge Chat"}
          </h1>

          <p className="text-xs text-green-600">
            {role === "child" ? "Parent" : "Child"} • Connected
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ item, mine }) => {
  const senderName = mine
    ? "You"
    : item.sender?.fullName ||
      (item.sender?.role === "parent" ? "Parent" : "Child") ||
      "Other user";

  const time = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex ${
        mine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          mine
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md bg-gray-100 text-gray-900"
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-semibold ${
            mine ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {senderName}
        </p>

        <p className="break-words text-sm">
          {item.message}
        </p>

        <div
          className={`mt-1 text-[10px] ${
            mine
              ? "text-blue-100"
              : "text-gray-500"
          }`}
        >
          {time}
          {mine && (
            <span className="ml-2">
              {item.read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex h-full min-h-[400px] items-center justify-center px-6 text-center">
    <div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
        💬
      </div>

      <h2 className="font-semibold text-gray-900">
        Start a conversation
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Send a message to your connected parent.
      </p>
    </div>
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [relationship, setRelationship] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  const loadRelationship = async () => {
    const result = await apiRequest(
      "/parent-child"
    );

    const active =
      result.data?.find((item) => item.active) ||
      result.data?.[0];

    setRelationship(active || null);

    return active;
  };

  const loadMessages = async (relationshipId) => {
    if (!relationshipId) return;

    try {
      const result = await apiRequest(
        `/messages/${relationshipId}`
      );

      setMessages(result.data || []);

      await apiRequest("/messages/read", {
        method: "PATCH",
        body: JSON.stringify({
          parentChildId: relationshipId,
        }),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    let interval;

    const init = async () => {
      try {
        setLoading(true);

        const active = await loadRelationship();

        if (active?._id) {
          await loadMessages(active._id);

          interval = setInterval(() => {
            loadMessages(active._id);
          }, 5000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (
      !message.trim() ||
      !relationship?._id ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
          parentChildId: relationship._id,
          message: message.trim(),
        }),
      });

      setMessage("");

      await loadMessages(relationship._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const parent =
    role === "child"
      ? relationship?.parent
      : relationship?.child;

  return (
    <main className="min-h-screen bg-gray-50">
      <ChatHeader parent={parent} role={role} />

      <div className="mx-auto flex h-[calc(100vh-81px)] max-w-3xl flex-col">
        {error && (
          <div className="mx-4 mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading conversation...
              </div>
            </div>
          ) : !relationship ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mb-3 text-4xl">
                  🔗
                </div>

                <h2 className="font-semibold">
                  No connected parent
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Connect a parent before using chat.
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {messages.map((item) => {
                const mine =
                  item.sender?._id ===
                  (typeof window !== "undefined"
                    ? localStorage.getItem("userId")
                    : "");

                return (
                  <MessageBubble
                    key={item._id}
                    item={item}
                    mine={mine}
                  />
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {relationship && (
          <form
            onSubmit={sendMessage}
            className="border-t bg-white p-3"
          >
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Type a message..."
                disabled={sending}
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={
                  sending || !message.trim()
                }
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
