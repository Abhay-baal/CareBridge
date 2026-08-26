"use client";

import { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { BottomNavContext } from "@/components/layout/BottomNavContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

const getUserId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUserId = localStorage.getItem("userId");

  if (storedUserId) {
    return storedUserId;
  }

  try {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return storedUser?.id || storedUser?._id || null;
  } catch {
    return null;
  }
};

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
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

const getDisplayName = (user, fallback = "CareBridge User") => {
  return user?.fullName?.trim() || fallback;
};

const getInitial = (user, fallback = "C") => {
  return (
    getDisplayName(user, fallback)
      .charAt(0)
      .toUpperCase() || "C"
  );
};

const formatTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatConversationTime = (date) => {
  if (!date) return "";

  const messageDate = new Date(date);
  const now = new Date();

  const sameDay =
    messageDate.toDateString() === now.toDateString();

  if (sameDay) {
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return messageDate.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

const Avatar = ({ user, size = "normal" }) => {
  const sizeClass =
    size === "large"
      ? "h-14 w-14 text-lg"
      : "h-12 w-12 text-base";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ${sizeClass}`}
    >
      {getInitial(user)}
    </div>
  );
};

const ConversationList = ({
  relationships,
  previews,
  selectedId,
  onSelect,
  role,
  showHeader = true,
}) => {
  const isParent = role === "parent";

  const title = isParent
    ? "Chat"
    : "Chat";

  const subtitle = isParent
    ? "Message your connected children"
    : "Message your connected parents";

  const emptyTitle = isParent
    ? "No connected children"
    : "No connected parents";

  const emptyMessage = isParent
    ? "Connect a child to start chatting."
    : "Connect a parent to start chatting.";

  return (
    <div className="flex h-full flex-col bg-white">
      {showHeader && (
        <div className="border-b px-5 pb-4 pt-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        {relationships.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                👥
              </div>

              <h2 className="font-semibold text-gray-900">
                {emptyTitle}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {emptyMessage}
              </p>
            </div>
          </div>
        ) : (
          relationships.map((relationship) => {
            const person = isParent
              ? relationship.child
              : relationship.parent;

            const preview = previews[relationship._id];

            const isSelected =
              relationship._id === selectedId;

            return (
              <button
                key={relationship._id}
                type="button"
                onClick={() => onSelect(relationship)}
                className={`flex w-full items-center gap-3 border-b px-5 py-4 text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <Avatar user={person} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate font-semibold text-gray-900">
                      {getDisplayName(
                        person,
                        isParent ? "Child" : "Parent"
                      )}
                    </h2>

                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatConversationTime(
                        preview?.createdAt
                      )}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-sm text-gray-500">
                    {preview?.message || "Start a conversation"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChatHeader = ({
  person,
  role,
  onBack,
}) => {
  const backPath =
    role === "child"
      ? "/child/dashboard"
      : "/dashboard";

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
              return;
            }

            window.location.href = backPath;
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <Avatar
          user={person}
          size="normal"
        />

        <div className="min-w-0">
          <h1 className="truncate font-semibold text-gray-900">
            {getDisplayName(
              person,
              "CareBridge Chat"
            )}
          </h1>

          <p className="text-xs text-green-600">
            {role === "child"
              ? "Parent"
              : "Child"}{" "}
            • Connected
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({
  item,
  mine,
}) => {
  const senderName = mine
    ? "You"
    : item.sender?.fullName ||
      (item.sender?.role === "parent"
        ? "Parent"
        : "Child");

  const isSnap = item.messageType === "snap";

  return (
    <div
      className={`flex ${
        mine
          ? "justify-end"
          : "justify-start"
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
            mine
              ? "text-blue-100"
              : "text-gray-500"
          }`}
        >
          {senderName}
        </p>

        {isSnap ? (
          item.snapData ? (
            <div>
              <img
                src={item.snapData}
                alt="Snap"
                className="max-h-[360px] w-auto max-w-full rounded-xl object-cover"
              />

              {item.snapExpiresAt && (
                <p
                  className={`mt-2 text-[10px] ${
                    mine
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  Snap
                </p>
              )}
            </div>
          ) : (
            <div
              className={`rounded-xl px-4 py-5 text-center text-sm ${
                mine
                  ? "bg-blue-700 text-blue-100"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              📸 Snap expired
            </div>
          )
        ) : (
          <p className="break-words text-sm">
            {item.message}
          </p>
        )}

        <div
          className={`mt-1 text-[10px] ${
            mine
              ? "text-blue-100"
              : "text-gray-500"
          }`}
        >
          {formatTime(item.createdAt)}

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

const EmptyState = ({ person }) => (
  <div className="flex h-full min-h-[400px] items-center justify-center px-6 text-center">
    <div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
        💬
      </div>

      <h2 className="font-semibold text-gray-900">
        Start a conversation
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Send a message to{" "}
        {getDisplayName(
          person,
          "your connection"
        )}.
      </p>
    </div>
  </div>
);

export default function ChatPage() {
  const [role, setRole] = useState(null);

  const [relationships, setRelationships] =
    useState([]);

  const [selectedRelationship, setSelectedRelationship] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [previews, setPreviews] = useState({});

  const [message, setMessage] = useState("");
  const [snapPreview, setSnapPreview] = useState(null);
  const [snapExpiresHours, setSnapExpiresHours] = useState(24);
  const [sendingSnap, setSendingSnap] = useState(false);


  const [loadingRelationships, setLoadingRelationships] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const { setShowBottomNav } =
    useContext(BottomNavContext);

  useEffect(() => {
    const storedRole =
      localStorage.getItem("role");

    setRole(storedRole);
  }, []);

  const loadRelationships = async () => {
    const result = await apiRequest(
      "/parent-child"
    );

    const data = Array.isArray(result.data)
      ? result.data
      : [];

    setRelationships(data);

    return data;
  };

  const loadConversationPreview = async (
    relationshipId
  ) => {
    try {
      const result = await apiRequest(
        `/messages/${relationshipId}`
      );

      const conversation =
        result.data || [];

      if (conversation.length > 0) {
        const lastMessage =
          conversation[
            conversation.length - 1
          ];

        setPreviews((current) => ({
          ...current,
          [relationshipId]: lastMessage,
        }));
      }
    } catch {
      // Preview failure should not break chat.
    }
  };

  const loadAllPreviews = async (
    relationshipList
  ) => {
    await Promise.all(
      relationshipList.map((relationship) =>
        loadConversationPreview(
          relationship._id
        )
      )
    );
  };

  const loadMessages = async (
    relationshipId
  ) => {
    if (!relationshipId) return;

    try {
      setLoadingMessages(true);
      setError("");

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

      const conversation =
        result.data || [];

      if (conversation.length > 0) {
        setPreviews((current) => ({
          ...current,
          [relationshipId]:
            conversation[
              conversation.length - 1
            ],
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoadingRelationships(true);
        setError("");

        const data =
          await loadRelationships();

        if (!mounted) return;

        if (data.length > 0) {
          await loadAllPreviews(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoadingRelationships(false);
        }
      }
    };

    if (role) {
      init();
    }

    return () => {
      mounted = false;
    };
  }, [role]);

  useEffect(() => {
    if (!selectedRelationship?._id) {
      return;
    }

    loadMessages(
      selectedRelationship._id
    );

    const interval = setInterval(() => {
      loadMessages(
        selectedRelationship._id
      );
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    selectedRelationship?._id,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    // Show bottom navigation on the chat list.
    // Hide it only while viewing an active conversation.
    setShowBottomNav(!selectedRelationship);

    return () => {
      setShowBottomNav(true);
    };
  }, [
    selectedRelationship,
    setShowBottomNav,
  ]);

  const handleSnapSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      e.target.value = "";
      return;
    }

    if (file.size > 1000000) {
      setError("Snap must be smaller than 1MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSnapPreview(reader.result);
      setError("");
    };

    reader.onerror = () => {
      setError("Unable to read snap.");
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const sendSnap = async () => {
    if (
      !snapPreview ||
      !selectedRelationship?._id ||
      sending ||
      sendingSnap
    ) {
      return;
    }

    try {
      setSendingSnap(true);
      setError("");

      const expiresAt = new Date(
        Date.now() +
          Number(snapExpiresHours) * 60 * 60 * 1000
      ).toISOString();

      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
          parentChildId:
            selectedRelationship._id,
          messageType: "snap",
          snapData: snapPreview,
          snapExpiresAt: expiresAt,
        }),
      });

      setSnapPreview(null);

      await loadMessages(
        selectedRelationship._id
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingSnap(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (
      !message.trim() ||
      !selectedRelationship?._id ||
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
          parentChildId:
            selectedRelationship._id,
          message: message.trim(),
        }),
      });

      setMessage("");

      await loadMessages(
        selectedRelationship._id
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!role) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Loading chat...
        </div>
      </main>
    );
  }

  const isParent = role === "parent";

  const selectedPerson = isParent
    ? selectedRelationship?.child
    : selectedRelationship?.parent;

  /*
   * IMPORTANT:
   * Both parent and child now start on the
   * conversation list.
   *
   * Parent -> connected children
   * Child  -> connected parents
   */
  if (!selectedRelationship) {
    return (
      <main className="min-h-screen bg-gray-50">
        {error && (
          <div className="mx-auto max-w-5xl px-4 pt-3">
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          </div>
        )}

        <div className="mx-auto flex h-[calc(100vh-0px)] max-w-5xl flex-col overflow-hidden border-x border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Chat
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isParent
                  ? "Choose a child to start chatting"
                  : "Choose a parent to start chatting"}
              </p>
            </div>

            <Link
              href={
                isParent
                  ? "/dashboard"
                  : "/child/dashboard"
              }
              className="ml-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
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

              <span className="hidden md:inline">
                {isParent
                  ? "Back to Dashboard"
                  : "Back to Child Dashboard"}
              </span>
            </Link>
          </div>

          {loadingRelationships ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading conversations...
              </div>
            </div>
          ) : (
            <ConversationList
              relationships={relationships}
              previews={previews}
              selectedId={null}
              onSelect={setSelectedRelationship}
              role={role}
              showHeader={false}
            />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {error && (
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}

      <div className="mx-auto flex h-screen max-w-5xl overflow-hidden border-x border-gray-200 bg-white shadow-sm">
        {isParent && (
          <aside className="hidden w-[340px] shrink-0 border-r border-gray-200 md:block">
            <ConversationList
              relationships={relationships}
              previews={previews}
              selectedId={
                selectedRelationship?._id
              }
              onSelect={
                setSelectedRelationship
              }
              role={role}
            />
          </aside>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <ChatHeader
            person={selectedPerson}
            role={role}
            onBack={() =>
              setSelectedRelationship(null)
            }
          />

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-sm text-gray-500">
                  Loading conversation...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                person={selectedPerson}
              />
            ) : (
              <div className="space-y-3">
                {messages.map((item) => {
                  const mine =
                    item.sender?._id ===
                    getUserId();

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

          {snapPreview && (
            <div className="border-t bg-gray-50 px-3 py-3">
              <div className="mx-auto flex max-w-3xl items-center gap-3">
                <img
                  src={snapPreview}
                  alt="Snap preview"
                  className="h-20 w-20 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Snap ready
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={snapExpiresHours}
                      onChange={(e) =>
                        setSnapExpiresHours(
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="1">
                        Expires in 1 hour
                      </option>
                      <option value="6">
                        Expires in 6 hours
                      </option>
                      <option value="24">
                        Expires in 24 hours
                      </option>
                      <option value="72">
                        Expires in 3 days
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSnapPreview(null)
                  }
                  className="rounded-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={sendSnap}
                  disabled={sendingSnap}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingSnap
                    ? "..."
                    : "Send Snap"}
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="border-t bg-white p-3"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <label
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-lg transition hover:border-blue-300 hover:bg-blue-50"
                title="Send Snap"
              >
                📸

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleSnapSelect}
                />
              </label>

              <input
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Type a message..."
                disabled={sending}
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  !message.trim()
                }
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending
                  ? "..."
                  : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
