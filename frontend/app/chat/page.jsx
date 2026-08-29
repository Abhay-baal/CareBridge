"use client";

import { getGenderAvatar } from "@/utils/genderAvatar";

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
        : getGenderAvatar(user)}
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
            ? "rounded-br-md bg-rose-100 text-rose-950"
            : "rounded-bl-md bg-white text-gray-900 shadow-sm ring-1 ring-rose-100"
        }`}
      >
        {!mine && (
          <p
            className={`mb-1 text-[10px] font-semibold ${
              mine
                ? "text-rose-400"
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
                    ? "text-rose-400"
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
                  ? "bg-rose-200 text-rose-700"
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
              ? "text-rose-400"
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

export default function ChatPage({ childMode = false }) {
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

  const homePath = childMode
    ? "/child/dashboard"
    : "/dashboard";
  const chatPath = childMode
    ? "/child/chat"
    : "/chat";

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
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#fafafa]">
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
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#fafafa]">
        <div className="text-sm text-gray-500">
          Loading family chat...
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#fafafa] px-4 pb-5 pt-5">
      {error && (
        <div className="mx-auto max-w-5xl pb-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-0 w-full flex-1 max-w-5xl overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_14px_32px_rgba(244,114,182,0.08)]">

        {/* ================================================= */}
        {/* CHAT LIST */}
        {/* ================================================= */}

        <aside
          className={`${
            selectedPerson
              ? "hidden md:flex"
              : "flex"
          } w-full shrink-0 flex-col border-r border-rose-100 bg-white md:w-[360px]`}
        >
          <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 px-5 pb-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  Chat
                </h1>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  Family conversations
                </p>
              </div>

              <Link
                href={homePath}
                aria-label="Open Home"
                className="group flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
                  🏠
                </span>

                <span className="text-xs font-black text-gray-900">
                  Home
                </span>
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-rose-50/50 to-[#fafafa] px-2 py-2 pb-20">

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
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-4 text-left transition ${
                isGroup
                  ? "bg-rose-100 text-rose-950 shadow-sm"
                  : "bg-transparent hover:bg-white"
              }`}
            >
              <Avatar
                group
                size="normal"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`truncate font-black ${isGroup ? "text-rose-950" : "text-gray-900"}`}>
                    Family Group
                  </h2>

                  <span className="shrink-0 text-[11px] text-gray-400">
                    {formatConversationTime(
                      latestGroupMessage?.createdAt
                    )}
                  </span>
                </div>

                <p className={`mt-1 truncate text-sm ${isGroup ? "text-rose-500" : "text-gray-500"}`}>
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
              <div className="px-6 py-10 text-center text-sm font-medium text-gray-500">
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
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-4 text-left transition ${
                        selected
                          ? "bg-white shadow-sm ring-1 ring-rose-200"
                          : "bg-transparent hover:bg-white"
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
              <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-rose-50/60 via-white to-orange-50/40 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-2xl shadow-sm">
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

              <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 px-4 py-4">
                <div className="mx-auto flex max-w-3xl items-center gap-3">

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

                  <div className="min-w-0 flex-1">
                    <h1 className="truncate font-black text-gray-900">
                      {isGroup
                        ? "Family Group"
                        : getDisplayName(
                            selectedPerson
                          )}
                    </h1>

                    <p className="text-xs font-semibold text-green-600">
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

                  <Link
                    href={chatPath}
                    onClick={() => setSelectedPerson(null)}
                    aria-label="Open Chat"
                    className="group flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
                      💬
                    </span>

                    <span className="text-xs font-black text-gray-900">
                      Chat
                    </span>
                  </Link>
                </div>
              </div>

              {/* MESSAGES */}

              <div className="flex-1 overflow-y-auto bg-gradient-to-br from-rose-50/40 via-white to-orange-50/30 px-4 py-5 pb-24">
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
                <div className="border-t border-rose-100 bg-gradient-to-br from-rose-50/70 to-orange-50/70 px-3 py-3">
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
                          className="rounded-xl border border-white bg-white/90 px-2 py-1.5 text-xs outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
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
                      className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-white"
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
                      className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-50"
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
                className="border-t border-rose-100 bg-white p-4"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-2">

                  <label
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-lg hover:border-rose-300 hover:bg-rose-100"
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
                    className="min-w-0 flex-1 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !message.trim()
                    }
                    className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
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
