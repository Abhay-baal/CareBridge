"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  getFamilyMembers,
  getFamilyMessages,
  getFamilyMessageStreak,
  sendFamilyMessage,
  getFamilySnaps,
  createFamilySnap,
  deleteFamilySnap,
} from "@/services/familyCommunicationService";

const getUserId = (user) =>
  user?._id || user?.id || "";

const getRoleEmoji = (role) => {
  if (role === "parent") return "👩";
  if (role === "child") return "👦";
  return "👤";
};

const getResponseArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};

export default function FamilyCommunication() {
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [snaps, setSnaps] = useState([]);

  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastMessageDate: null,
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingSnap, setUploadingSnap] = useState(false);

  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] =
    useState("everyone");
  const [selectedRecipients, setSelectedRecipients] =
    useState([]);

  const [snapCaption, setSnapCaption] = useState("");
  const [snapRecipients, setSnapRecipients] =
    useState([]);

  const fileInputRef = useRef(null);

  const currentUserId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId") ||
        localStorage.getItem("user_id") ||
        ""
      : "";

  const otherMembers = useMemo(() => {
    const familyMembers = Array.isArray(members)
      ? members
      : [];

    return familyMembers.filter(
      (member) =>
        getUserId(member).toString() !==
        currentUserId.toString()
    );
  }, [members, currentUserId]);

  const loadMessages = async () => {
    try {
      const response = await getFamilyMessages();

      setMessages(getResponseArray(response));
    } catch {
      // Keep the dashboard usable if polling temporarily fails.
    }
  };

  const loadSnaps = async () => {
    try {
      const response = await getFamilySnaps();

      setSnaps(getResponseArray(response));
    } catch {
      // Keep existing snaps visible.
    }
  };

  const loadStreak = async () => {
    try {
      const response = await getFamilyMessageStreak();

      const data = response?.data?.data;

      if (data) {
        setStreak({
          currentStreak: Number(data.currentStreak || 0),
          longestStreak: Number(data.longestStreak || 0),
          lastMessageDate: data.lastMessageDate || null,
        });
      }
    } catch (error) {
      console.error(
        "Family message streak load error:",
        error
      );
    }
  };

  const loadFamily = async () => {
    try {
      setLoading(true);

      const [
        membersResponse,
        messagesResponse,
        snapsResponse,
        streakResponse,
      ] = await Promise.all([
        getFamilyMembers(),
        getFamilyMessages(),
        getFamilySnaps(),
        getFamilyMessageStreak(),
      ]);

      setMembers(getResponseArray(membersResponse));
      setMessages(getResponseArray(messagesResponse));
      setSnaps(getResponseArray(snapsResponse));

      const streakData = streakResponse?.data?.data;

      if (streakData) {
        setStreak({
          currentStreak: Number(
            streakData.currentStreak || 0
          ),
          longestStreak: Number(
            streakData.longestStreak || 0
          ),
          lastMessageDate:
            streakData.lastMessageDate || null,
        });
      }
    } catch (error) {
      console.error(
        "Family communication load error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load family communication"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();

    const interval = setInterval(() => {
      loadMessages();
      loadSnaps();
      loadStreak();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const toggleRecipient = (id, setter) => {
    setter((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Write a message first");
      return;
    }

    try {
      setSending(true);

      const recipients =
        recipientMode === "everyone"
          ? []
          : selectedRecipients;

      if (
        recipientMode === "specific" &&
        recipients.length === 0
      ) {
        toast.error(
          "Select at least one family member"
        );
        return;
      }

      const response = await sendFamilyMessage(
        message.trim(),
        recipients
      );

      setMessage("");
      setSelectedRecipients([]);
      setRecipientMode("everyone");

      if (response?.data?.streak) {
        setStreak({
          currentStreak: Number(
            response.data.streak.currentStreak || 0
          ),
          longestStreak: Number(
            response.data.streak.longestStreak || 0
          ),
          lastMessageDate:
            response.data.streak.lastMessageDate ||
            null,
        });
      }

      await loadMessages();

      toast.success("Family message sent ❤️");
    } catch (error) {
      console.error(
        "Send family message error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to send family message"
      );
    } finally {
      setSending(false);
    }
  };

  const handleSnapUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Snap must be smaller than 5MB"
      );
      return;
    }

    try {
      setUploadingSnap(true);

      const imageData = await new Promise(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () =>
            resolve(reader.result);

          reader.onerror = reject;

          reader.readAsDataURL(file);
        }
      );

      const recipients =
        snapRecipients.length > 0
          ? snapRecipients
          : [];

      await createFamilySnap({
        imageData,
        caption: snapCaption.trim(),
        recipientIds: recipients,
      });

      setSnapCaption("");
      setSnapRecipients([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(
        "Family Snap shared 📸"
      );

      await loadSnaps();
    } catch (error) {
      console.error(
        "Family snap upload error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to upload Snap"
      );
    } finally {
      setUploadingSnap(false);
    }
  };

  const mySnaps = snaps.filter(
    (snap) =>
      getUserId(snap.sender).toString() ===
      currentUserId.toString()
  );

  const visibleSnaps = snaps.filter(
    (snap) =>
      getUserId(snap.sender).toString() !==
      currentUserId.toString()
  );

  const latestSnapBySender = [
    ...new Map(
      visibleSnaps.map((snap) => [
        getUserId(
          snap.sender
        ).toString(),
        snap,
      ])
    ).values(),
  ];

  const latestMySnap = mySnaps[0];

  /*
   * Only ONE family message is displayed.
   *
   * The backend also keeps only one active message
   * per sender, so this is intentionally not a feed.
   */
  const latestMessage = messages[0] || null;

  const latestMessageSender =
    latestMessage?.sender;

  const latestMessageSenderId =
    getUserId(latestMessageSender);

  const latestMessageIsMine =
    latestMessageSenderId.toString() ===
    currentUserId.toString();

  if (loading) {
    return (
      <section className="mt-6 space-y-5">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-8 w-40 rounded-full bg-gray-200" />
            <div className="mx-auto h-16 w-24 rounded-2xl bg-gray-200" />
            <div className="mx-auto h-4 w-56 rounded bg-gray-100" />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-24 rounded-xl bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-5">

      {/* =====================================================
          FAMILY MESSAGE STREAK
      ====================================================== */}
      <div className="relative overflow-hidden rounded-3xl border bg-white p-6 text-center shadow-sm">

        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100 blur-2xl" />

        <div className="relative">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">
            🔥 Family Message Streak
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-5xl">🔥</span>

            <span className="text-6xl font-black leading-none text-gray-900">
              {streak.currentStreak}
            </span>

            <span className="text-left text-sm font-bold uppercase leading-tight text-gray-500">
              {streak.currentStreak === 1
                ? "Day"
                : "Days"}
              <br />
              Together
            </span>
          </div>

          <p className="mx-auto mt-4 max-w-xs text-sm font-medium text-gray-600">
            Keep the family message streak alive
            every day ❤️
          </p>

          <div className="mt-5 flex items-center justify-center gap-6 text-xs">
            <div>
              <p className="font-bold text-gray-900">
                {streak.currentStreak}
              </p>
              <p className="text-gray-500">
                Current
              </p>
            </div>

            <div className="h-8 w-px bg-gray-200" />

            <div>
              <p className="font-bold text-gray-900">
                {streak.longestStreak}
              </p>
              <p className="text-gray-500">
                Best
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CURRENT FAMILY MESSAGE
      ====================================================== */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              💌 Family Message
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              One message at a time. Send a new one
              to replace the previous one.
            </p>
          </div>
        </div>

        {messages.length > 0 ? (
          <div className="mt-5 space-y-3">
            {messages.map((item) => {
              const sender = item.sender;
              const senderId = getUserId(sender);

              const isMine =
                senderId.toString() ===
                currentUserId.toString();

              return (
                <div
                  key={item._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      {getRoleEmoji(sender?.role)}
                    </div>

                    <div>
                      <p className="text-base font-bold text-gray-900">
                        {isMine
                          ? "You"
                          : sender?.fullName ||
                            "Family Member"}
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-gray-500">
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                    <p className="whitespace-pre-wrap break-words text-lg font-medium leading-7 text-gray-900">
                      {item.message}
                    </p>
                  </div>

                  {Array.isArray(item.recipients) &&
                    item.recipients.length > 0 && (
                      <p className="mt-3 text-xs font-medium text-gray-500">
                        Sent to{" "}
                        {item.recipients
                          .map(
                            (recipient) =>
                              getUserId(recipient) ===
                              currentUserId
                                ? "You"
                                : recipient.fullName
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div className="text-4xl">💌</div>

            <p className="mt-3 text-base font-bold text-gray-900">
              No family message yet
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Send the first message and start
              your family streak.
            </p>
          </div>
        )}

        {/* SMALL MESSAGE INPUT */}
        <div className="mt-5">

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Write something to your family..."
            maxLength={2000}
            rows={2}
            className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">
              {message.length}/2000
            </span>

            <span className="text-[11px] font-medium text-gray-500">
              New message replaces the old one
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs font-bold text-gray-700">
              Send to
            </label>

            <select
              value={recipientMode}
              onChange={(event) => {
                const value =
                  event.target.value;

                setRecipientMode(value);

                if (value === "everyone") {
                  setSelectedRecipients([]);
                }
              }}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-gray-900"
            >
              <option value="everyone">
                👨‍👩‍👧 Everyone
              </option>

              <option value="specific">
                👤 Select family members
              </option>
            </select>
          </div>

          {recipientMode === "specific" && (
            <div className="mt-3 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
              {otherMembers.length === 0 ? (
                <p className="text-sm font-medium text-gray-600">
                  No other family members available.
                </p>
              ) : (
                otherMembers.map((member) => {
                  const id = getUserId(member);

                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(
                          id
                        )}
                        onChange={() =>
                          toggleRecipient(
                            id,
                            setSelectedRecipients
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-lg">
                        {getRoleEmoji(
                          member.role
                        )}
                      </span>

                      <span className="font-semibold text-gray-900">
                        {member.fullName}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          )}

          <button
            onClick={handleSendMessage}
            disabled={
              sending ||
              !message.trim() ||
              otherMembers.length === 0
            }
            className="mt-4 w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send Family Message 💌"}
          </button>
        </div>
      </div>

      {/* =====================================================
          FAMILY SNAPS
      ====================================================== */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        <div>
          <h2 className="text-xl font-black text-gray-900">
            📸 Family Snaps
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-600">
            Snaps disappear automatically after 24
            hours
          </p>
        </div>

        {/* CREATE SNAP */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">

          <div className="flex items-center gap-3">
            <span className="text-2xl">
              📸
            </span>

            <div>
              <p className="text-sm font-bold text-gray-900">
                Share a Snap
              </p>

              <p className="text-xs font-medium text-gray-600">
                Default: everyone
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSnapUpload}
            disabled={uploadingSnap}
            className="mt-4 block w-full text-sm font-medium text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />

          <input
            value={snapCaption}
            onChange={(event) =>
              setSnapCaption(
                event.target.value
              )
            }
            placeholder="Add a caption (optional)"
            maxLength={200}
            className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none focus:border-gray-900"
          />

          {otherMembers.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-700">
                Snap recipients
              </p>

              <div className="mt-2 space-y-1">
                {otherMembers.map((member) => {
                  const id = getUserId(member);

                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-900 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={snapRecipients.includes(
                          id
                        )}
                        onChange={() =>
                          toggleRecipient(
                            id,
                            setSnapRecipients
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span>
                        {getRoleEmoji(
                          member.role
                        )}
                      </span>

                      <span>
                        {member.fullName}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] font-medium text-gray-500">
                Select nobody to share with everyone.
              </p>
            </div>
          )}

          {uploadingSnap && (
            <p className="mt-3 text-xs font-bold text-blue-600">
              Uploading Snap...
            </p>
          )}
        </div>

        {/* MY SNAP */}
        {latestMySnap && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-gray-900">
                  {getRoleEmoji(
                    latestMySnap.sender?.role
                  )}{" "}
                  MY SNAP
                </p>

                <p className="text-[11px] font-medium text-gray-500">
                  Expires{" "}
                  {new Date(
                    latestMySnap.expiresAt
                  ).toLocaleString()}
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    await deleteFamilySnap(
                      latestMySnap._id
                    );

                    setSnaps((current) =>
                      current.filter(
                        (snap) =>
                          snap._id !==
                          latestMySnap._id
                      )
                    );

                    toast.success(
                      "Snap deleted"
                    );
                  } catch {
                    toast.error(
                      "Unable to delete Snap"
                    );
                  }
                }}
                className="text-xs font-bold text-red-500"
              >
                Delete
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-black">
              <img
                src={latestMySnap.imageData}
                alt="My family snap"
                className="max-h-[420px] w-full object-cover"
              />
            </div>

            {latestMySnap.caption && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                {latestMySnap.caption}
              </p>
            )}
          </div>
        )}

        {/* OTHER FAMILY SNAPS */}
        <div className="mt-6 space-y-5">
          {latestSnapBySender.map((snap) => (
            <div key={snap._id}>

              <div className="mb-2">
                <p className="text-sm font-black text-gray-900">
                  {getRoleEmoji(
                    snap.sender?.role
                  )}{" "}
                  {snap.sender?.fullName ||
                    "Family Member"}{" "}
                  SNAP
                </p>

                <p className="text-[11px] font-medium text-gray-500">
                  Expires{" "}
                  {new Date(
                    snap.expiresAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border bg-black">
                <img
                  src={snap.imageData}
                  alt={`${
                    snap.sender?.fullName ||
                    "Family"
                  } snap`}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>

              {snap.caption && (
                <p className="mt-2 text-sm font-medium text-gray-700">
                  {snap.caption}
                </p>
              )}
            </div>
          ))}

          {latestSnapBySender.length === 0 &&
            !latestMySnap && (
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <div className="text-3xl">
                  📸
                </div>

                <p className="mt-2 text-sm font-bold text-gray-900">
                  No active family snaps
                </p>

                <p className="mt-1 text-xs font-medium text-gray-600">
                  Share the first one!
                </p>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
