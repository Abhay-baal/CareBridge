"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BottomNavContext } from "@/components/layout/BottomNavContext";
import { useContext } from "react";

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

  const storedUserId =
    localStorage.getItem("userId");

  if (storedUserId) {
    return storedUserId;
  }

  try {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return (
      storedUser?.id ||
      storedUser?._id ||
      null
    );
  } catch {
    return null;
  }
};

const apiRequest = async (
  url,
  options = {}
) => {
  const token = getToken();

  const response = await fetch(
    `${API_URL}${url}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Something went wrong"
    );
  }

  return data;
};

const getDisplayName = (
  user,
  fallback = "CareBridge User"
) => {
  return (
    user?.fullName?.trim() ||
    fallback
  );
};

const getInitial = (
  user,
  fallback = "C"
) => {
  return (
    getDisplayName(user, fallback)
      .charAt(0)
      .toUpperCase() || "C"
  );
};

const formatTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatConversationTime = (
  date
) => {
  if (!date) return "";

  const messageDate = new Date(date);
  const now = new Date();

  if (
    messageDate.toDateString() ===
    now.toDateString()
  ) {
    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  const yesterday = new Date(now);
  yesterday.setDate(
    now.getDate() - 1
  );

  if (
    messageDate.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Yesterday";
  }

  return messageDate.toLocaleDateString(
    [],
    {
      day: "2-digit",
      month: "short",
    }
  );
};

const Avatar = ({
  user,
  size = "normal",
  group = false,
}) => {
  const sizeClass =
    size === "large"
      ? "h-14 w-14 text-lg"
      : "h-12 w-12 text-base";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        group
          ? "bg-indigo-100 text-indigo-700"
          : "bg-blue-100 text-blue-700"
      } ${sizeClass}`}
    >
      {group
        ? "👨‍👩‍👧"
        : getInitial(user)}
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
      "Family Member";

  const isSnap =
    item.messageType === "snap";

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
        {!mine && (
          <p
            className={`mb-1 text-[10px] font-semibold ${
              mine
                ? "text-blue-100"
                : "text-gray-500"
            }`}
          >
            {senderName}
          </p>
        )}

        {isSnap ? (
          item.snapData ? (
            <div>
              <img
                src={item.snapData}
                alt="Snap"
                className="max-h-[360px] w-auto max-w-full rounded-xl object-cover"
              />

              <p
                className={`mt-2 text-[10px] ${
                  mine
                    ? "text-blue-100"
                    : "text-gray-500"
                }`}
              >
                📸 Snap
              </p>
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

          {mine &&
            item.read !== undefined && (
              <span className="ml-2">
                {item.read
                  ? "✓✓"
                  : "✓"}
              </span>
            )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({
  group,
  person,
}) => (
  <div className="flex h-full min-h-[400px] items-center justify-center px-6 text-center">
    <div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
        {group ? "👨‍👩‍👧" : "💬"}
      </div>

      <h2 className="font-semibold text-gray-900">
        {group
          ? "Start a family conversation"
          : "Start a conversation"}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {group
          ? "Send the first message to your family."
          : `Send a message to ${getDisplayName(
              person,
              "your family member"
            )}.`}
      </p>
    </div>
  </div>
);

export default function ChatPage() {
  const [role, setRole] = useState(null);

  const [family, setFamily] =
    useState(null);

  const [familyMembers, setFamilyMembers] =
    useState([]);

  const [groupMessages, setGroupMessages] =
    useState([]);

  const [selectedPerson, setSelectedPerson] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [sendingSnap, setSendingSnap] =
    useState(false);

  const [snapPreview, setSnapPreview] =
    useState(null);

  const [snapExpiresHours, setSnapExpiresHours] =
    useState("24");

  const [error, setError] =
    useState("");

  const bottomRef = useRef(null);

  const {
    setShowBottomNav,
  } = useContext(
    BottomNavContext
  );

  const currentUserId =
    getUserId();

  /*
   * Every family member except yourself.
   *
   * This is deliberately based on Family,
   * not ParentChild.
   */
  const individualMembers = useMemo(() => {
    return familyMembers.filter(
      (member) =>
        member._id?.toString() !==
        currentUserId?.toString()
    );
  }, [
    familyMembers,
    currentUserId,
  ]);

  const latestGroupMessage =
    groupMessages.length > 0
      ? groupMessages[
          groupMessages.length - 1
        ]
      : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedUser =
      JSON.parse(
        localStorage.getItem(
          "user"
        ) || "{}"
      );

    setRole(
      storedUser?.role || null
    );
  }, []);

  const loadChat = async ({
    initial = false,
  } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      }

      setError("");

      const [
        familyResult,
        membersResult,
      ] = await Promise.all([
        apiRequest("/family/me"),
        apiRequest("/family/chat/members"),
      ]);

      setFamily(
        familyResult.data || null
      );

      setFamilyMembers(
        membersResult.data || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      if (initial) {
        setLoading(false);
      }
    }
  };

  const refreshGroupMessages = async () => {
    try {
      const result =
        await apiRequest(
          "/family/chat/group/messages"
        );

      setGroupMessages(
        result.data || []
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!role) return;

    loadChat({
      initial: true,
    });
  }, [role]);

  useEffect(() => {
    if (!selectedPerson) {
      setShowBottomNav(true);
      return;
    }

    setShowBottomNav(false);

    return () =>
      setShowBottomNav(true);
  }, [
    selectedPerson,
    setShowBottomNav,
  ]);

  const loadGroupMessages =
    async () => {
      try {
        const result =
          await apiRequest(
            "/family/chat/group/messages"
          );

        setGroupMessages(
          result.data || []
        );
      } catch (err) {
        setError(err.message);
      }
    };

  const loadDirectMessages =
    async (
      userId,
      {
        initial = false,
      } = {}
    ) => {
      if (!userId) return;

      try {
        if (initial) {
          setLoadingMessages(true);
        }

        setError("");

        const result =
          await apiRequest(
            `/family/chat/direct/${userId}`
          );

        setMessages(
          result.data || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        if (initial) {
          setLoadingMessages(false);
        }
      }
    };

  useEffect(() => {
    if (!selectedPerson) {
      return;
    }

    let cancelled = false;
    let interval;

    const loadSelectedConversation =
      async () => {
        if (cancelled) return;

        if (
          selectedPerson.type ===
          "group"
        ) {
          await loadGroupMessages();
          return;
        }

        await loadDirectMessages(
          selectedPerson._id,
          {
            initial: true,
          }
        );
      };

    loadSelectedConversation();

    interval = setInterval(
      async () => {
        if (cancelled) return;

        if (
          selectedPerson.type ===
          "group"
        ) {
          await loadGroupMessages();
        } else {
          await loadDirectMessages(
            selectedPerson._id
          );
        }
      },
      5000
    );

    return () => {
      cancelled = true;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    selectedPerson?._id,
    selectedPerson?.type,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [
    messages,
    groupMessages,
  ]);

  const handleSnapSelect = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select an image."
      );
      e.target.value = "";
      return;
    }

    if (file.size > 1000000) {
      setError(
        "Snap must be smaller than 1MB."
      );
      e.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setSnapPreview(
        reader.result
      );
      setError("");
    };

    reader.onerror = () => {
      setError(
        "Unable to read snap."
      );
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const sendCurrentMessage =
    async (e) => {
      e.preventDefault();

      if (
        !message.trim() ||
        !selectedPerson ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);
        setError("");

        if (
          selectedPerson.type ===
          "group"
        ) {
          await apiRequest(
            "/family/chat/group/messages",
            {
              method: "POST",
              body: JSON.stringify({
                message:
                  message.trim(),
                messageType:
                  "text",
              }),
            }
          );

          setMessage("");

          await loadGroupMessages();
        } else {
          await apiRequest(
            `/family/chat/direct/${selectedPerson._id}`,
            {
              method: "POST",
              body: JSON.stringify({
                message:
                  message.trim(),
                messageType:
                  "text",
              }),
            }
          );

          setMessage("");

          await loadDirectMessages(
            selectedPerson._id
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    };

  const sendSnap = async () => {
    if (
      !snapPreview ||
      !selectedPerson ||
      sendingSnap
    ) {
      return;
    }

    try {
      setSendingSnap(true);
      setError("");

      const expiresAt =
        new Date(
          Date.now() +
            Number(
              snapExpiresHours
            ) *
              60 *
              60 *
              1000
        ).toISOString();

      if (
        selectedPerson.type ===
        "group"
      ) {
        await apiRequest(
          "/family/chat/group/messages",
          {
            method: "POST",
            body: JSON.stringify({
              messageType:
                "snap",
              snapData:
                snapPreview,
              snapExpiresAt:
                expiresAt,
            }),
          }
        );

        setSnapPreview(
          null
        );

        await loadGroupMessages();
      } else {
        await apiRequest(
          `/family/chat/direct/${selectedPerson._id}`,
          {
            method: "POST",
            body: JSON.stringify({
              messageType:
                "snap",
              snapData:
                snapPreview,
              snapExpiresAt:
                expiresAt,
            }),
          }
        );

        setSnapPreview(
          null
        );

        await loadDirectMessages(
          selectedPerson._id
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingSnap(false);
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

  const isGroup =
    selectedPerson?.type ===
    "group";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Loading family chat...
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

        {/* ================================================= */}
        {/* CHAT LIST */}
        {/* ================================================= */}

        <aside
          className={`${
            selectedPerson
              ? "hidden md:flex"
              : "flex"
          } w-full shrink-0 flex-col border-r border-gray-200 md:w-[340px]`}
        >
          <div className="border-b px-5 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Chat
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Family conversations
                </p>
              </div>

              <Link
                href={
                  role ===
                  "child"
                    ? "/child/dashboard"
                    : "/dashboard"
                }
                className="rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">

            {/* FAMILY GROUP */}

            <button
              type="button"
              onClick={() =>
                setSelectedPerson({
                  type: "group",
                  _id:
                    family?._id ||
                    "family",
                  fullName:
                    "Family Group",
                })
              }
              className={`flex w-full items-center gap-3 border-b px-5 py-4 text-left transition ${
                isGroup
                  ? "bg-indigo-50"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <Avatar
                group
                size="normal"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate font-semibold text-gray-900">
                    Family Group
                  </h2>

                  <span className="shrink-0 text-[11px] text-gray-400">
                    {formatConversationTime(
                      latestGroupMessage?.createdAt
                    )}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {latestGroupMessage
                    ? `${
                        latestGroupMessage
                          .sender
                          ?.fullName ||
                        "Family Member"
                      }: ${
                        latestGroupMessage
                          .message ||
                        "Snap"
                      }`
                    : "Everyone in the family"}
                </p>
              </div>
            </button>

            {/* INDIVIDUAL FAMILY MEMBERS */}

            {individualMembers.length ===
            0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No other family members yet.
              </div>
            ) : (
              individualMembers.map(
                (person) => {
                  const selected =
                    !isGroup &&
                    selectedPerson?._id ===
                      person._id;

                  return (
                    <button
                      key={person._id}
                      type="button"
                      onClick={() =>
                        setSelectedPerson(
                          person
                        )
                      }
                      className={`flex w-full items-center gap-3 border-b px-5 py-4 text-left transition ${
                        selected
                          ? "bg-blue-50"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Avatar
                        user={person}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="truncate font-semibold text-gray-900">
                            {getDisplayName(
                              person
                            )}
                          </h2>
                        </div>

                        <p className="mt-1 truncate text-xs capitalize text-gray-500">
                          {person.role}
                        </p>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        {/* ================================================= */}
        {/* CHAT WINDOW */}
        {/* ================================================= */}

        <section
          className={`${
            selectedPerson
              ? "flex"
              : "hidden md:flex"
          } min-w-0 flex-1 flex-col`}
        >
          {!selectedPerson ? (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                  💬
                </div>

                <h2 className="font-semibold text-gray-900">
                  Select a conversation
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Start with your Family Group or an individual family member.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* HEADER */}

              <div className="border-b bg-white px-4 py-3">
                <div className="mx-auto flex max-w-3xl items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPerson(
                        null
                      )
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                    aria-label="Back"
                  >
                    ←
                  </button>

                  {isGroup ? (
                    <Avatar
                      group
                      size="normal"
                    />
                  ) : (
                    <Avatar
                      user={
                        selectedPerson
                      }
                    />
                  )}

                  <div className="min-w-0">
                    <h1 className="truncate font-semibold text-gray-900">
                      {isGroup
                        ? "Family Group"
                        : getDisplayName(
                            selectedPerson
                          )}
                    </h1>

                    <p className="text-xs text-green-600">
                      {isGroup
                        ? `${familyMembers.length} family members`
                        : `${
                            selectedPerson.role ===
                            "parent"
                              ? "Parent"
                              : "Child"
                          } • Family`}
                    </p>
                  </div>
                </div>
              </div>

              {/* MESSAGES */}

              <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
                {loadingMessages &&
                !isGroup ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-sm text-gray-500">
                      Loading conversation...
                    </div>
                  </div>
                ) : isGroup &&
                  groupMessages.length ===
                    0 ? (
                  <EmptyState
                    group
                  />
                ) : !isGroup &&
                  messages.length ===
                    0 ? (
                  <EmptyState
                    person={
                      selectedPerson
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {(isGroup
                      ? groupMessages
                      : messages
                    ).map(
                      (item) => {
                        const mine =
                          item.sender?._id?.toString() ===
                          currentUserId?.toString();

                        return (
                          <MessageBubble
                            key={
                              item._id
                            }
                            item={
                              item
                            }
                            mine={
                              mine
                            }
                          />
                        );
                      }
                    )}

                    <div
                      ref={
                        bottomRef
                      }
                    />
                  </div>
                )}
              </div>

              {/* SNAP PREVIEW */}

              {snapPreview && (
                <div className="border-t bg-gray-50 px-3 py-3">
                  <div className="mx-auto flex max-w-3xl items-center gap-3">

                    <img
                      src={
                        snapPreview
                      }
                      alt="Snap preview"
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Snap ready
                      </p>

                      <div className="mt-2">
                        <select
                          value={
                            snapExpiresHours
                          }
                          onChange={(
                            e
                          ) =>
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
                        setSnapPreview(
                          null
                        )
                      }
                      className="rounded-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        sendSnap
                      }
                      disabled={
                        sendingSnap
                      }
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingSnap
                        ? "..."
                        : "Send Snap"}
                    </button>
                  </div>
                </div>
              )}

              {/* INPUT */}

              <form
                onSubmit={
                  sendCurrentMessage
                }
                className="border-t bg-white p-3"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-2">

                  <label
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-lg hover:border-blue-300 hover:bg-blue-50"
                    title="Send Snap"
                  >
                    📸

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={
                        handleSnapSelect
                      }
                    />
                  </label>

                  <input
                    value={
                      message
                    }
                    onChange={(
                      e
                    ) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    placeholder={
                      isGroup
                        ? "Message your family..."
                        : `Message ${getDisplayName(
                            selectedPerson
                          )}...`
                    }
                    disabled={
                      sending
                    }
                    className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !message.trim()
                    }
                    className="rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? "..."
                      : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
