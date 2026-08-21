"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  getFamilyMembers,
  getFamilyMessages,
  sendFamilyMessage,
  getFamilySnaps,
  createFamilySnap,
  deleteFamilySnap,
} from "@/services/familyCommunicationService";

const getUserId = (user) =>
  user?._id || user?.id || "";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

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

  return [];
};

export default function FamilyCommunication() {
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [snaps, setSnaps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingSnap, setUploadingSnap] = useState(false);

  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState("everyone");
  const [selectedRecipients, setSelectedRecipients] = useState([]);

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

  const otherMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          getUserId(member).toString() !==
          currentUserId.toString()
      ),
    [members, currentUserId]
  );

  const loadFamily = async () => {
    try {
      setLoading(true);

      const [
        membersResponse,
        messagesResponse,
        snapsResponse,
      ] = await Promise.all([
        getFamilyMembers(),
        getFamilyMessages(),
        getFamilySnaps(),
      ]);

      setMembers(getResponseArray(membersResponse));
      setMessages(getResponseArray(messagesResponse));
      setSnaps(getResponseArray(snapsResponse));
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
      getFamilyMessages()
        .then((response) => {
          setMessages(getResponseArray(response));
        })
        .catch(() => {});

      getFamilySnaps()
        .then((response) => {
          setSnaps(getResponseArray(response));
        })
        .catch(() => {});
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
        toast.error("Select at least one family member");
        return;
      }

      await sendFamilyMessage(
        message.trim(),
        recipients
      );

      setMessage("");
      setSelectedRecipients([]);

      toast.success("Family message sent ❤️");

      const response = await getFamilyMessages();
      setMessages(getResponseArray(response));
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
      toast.error("Snap must be smaller than 5MB");
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

      toast.success("Family Snap shared 📸");

      const response = await getFamilySnaps();
      setSnaps(getResponseArray(response));
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
        getUserId(snap.sender).toString(),
        snap,
      ])
    ).values(),
  ];

  const latestMySnap = mySnaps[0];

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-20 rounded-xl bg-gray-100" />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-5">

      {/* RECENT FAMILY MESSAGES */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            💌 Family Message
          </h2>

          <span className="text-xs text-gray-400">
            Latest 30
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 p-5 text-center">
            <div className="text-2xl">💬</div>

            <p className="mt-2 text-sm text-gray-500">
              No family messages yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {messages.slice(0, 10).map((item) => {
              const sender = item.sender;
              const senderId = getUserId(sender);

              const isMine =
                senderId.toString() ===
                currentUserId.toString();

              return (
                <div
                  key={item._id}
                  className={`rounded-xl p-3 ${
                    isMine
                      ? "bg-blue-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                      {getRoleEmoji(sender?.role)}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {isMine
                          ? "You"
                          : sender?.fullName ||
                            "Family Member"}
                      </p>

                      <p className="text-[10px] text-gray-400">
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {item.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* FAMILY MESSAGE */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              💌 Family Message
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Share something with your family
            </p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Write something to your family..."
          maxLength={2000}
          rows={4}
          className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        />

        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500">
            Send to
          </label>

          <select
            value={recipientMode}
            onChange={(event) => {
              setRecipientMode(event.target.value);

              if (
                event.target.value === "everyone"
              ) {
                setSelectedRecipients([]);
              }
            }}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
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
          <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
            {otherMembers.map((member) => {
              const id = getUserId(member);

              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white"
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
                  />

                  <span>
                    {getRoleEmoji(member.role)}
                  </span>

                  <span className="text-sm font-medium">
                    {member.fullName}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <button
          onClick={handleSendMessage}
          disabled={
            sending ||
            !message.trim() ||
            otherMembers.length === 0
          }
          className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send 💌"}
        </button>
      </div>

      {/* FAMILY SNAPS */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            📸 Family Snaps
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Snaps disappear automatically after 24 hours
          </p>
        </div>

        {/* CREATE SNAP */}
        <div className="mt-4 rounded-xl bg-gray-50 p-4">

          <div className="flex items-center gap-2">
            <span className="text-xl">
              📸
            </span>

            <div>
              <p className="text-sm font-semibold">
                Share a Snap
              </p>

              <p className="text-xs text-gray-500">
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
            className="mt-3 block w-full text-xs"
          />

          <input
            value={snapCaption}
            onChange={(event) =>
              setSnapCaption(event.target.value)
            }
            placeholder="Add a caption (optional)"
            maxLength={200}
            className="mt-3 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          {otherMembers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">
                Snap recipients
              </p>

              <div className="mt-2 space-y-1">
                {otherMembers.map((member) => {
                  const id = getUserId(member);

                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 text-sm"
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
                      />

                      {getRoleEmoji(member.role)}

                      <span>
                        {member.fullName}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] text-gray-400">
                Select nobody to share with everyone.
              </p>
            </div>
          )}

          {uploadingSnap && (
            <p className="mt-3 text-xs font-medium text-blue-600">
              Uploading Snap...
            </p>
          )}
        </div>

        {/* MY SNAP */}
        {latestMySnap && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {getRoleEmoji(
                    latestMySnap.sender?.role
                  )}{" "}
                  MY SNAP
                </p>

                <p className="text-[11px] text-gray-400">
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

                    toast.success("Snap deleted");
                  } catch {
                    toast.error(
                      "Unable to delete Snap"
                    );
                  }
                }}
                className="text-xs font-medium text-red-500"
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
              <p className="mt-2 text-sm text-gray-600">
                {latestMySnap.caption}
              </p>
            )}
          </div>
        )}

        {/* OTHER FAMILY SNAPS */}
        <div className="mt-5 space-y-5">
          {latestSnapBySender.map((snap) => (
            <div key={snap._id}>

              <div className="mb-2">
                <p className="text-sm font-bold text-gray-900">
                  {getRoleEmoji(
                    snap.sender?.role
                  )}{" "}
                  {snap.sender?.fullName ||
                    "Family Member"}{" "}
                  SNAP
                </p>

                <p className="text-[11px] text-gray-400">
                  Expires{" "}
                  {new Date(
                    snap.expiresAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border bg-black">
                <img
                  src={snap.imageData}
                  alt={`${snap.sender?.fullName || "Family"} snap`}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>

              {snap.caption && (
                <p className="mt-2 text-sm text-gray-600">
                  {snap.caption}
                </p>
              )}
            </div>
          ))}

          {latestSnapBySender.length === 0 &&
            !latestMySnap && (
              <div className="rounded-xl bg-gray-50 p-5 text-center">
                <div className="text-3xl">📸</div>

                <p className="mt-2 text-sm text-gray-500">
                  No active family snaps.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Share the first one!
                </p>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
