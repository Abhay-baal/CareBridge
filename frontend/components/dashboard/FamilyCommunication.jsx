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

  // Snap preview/location state.
  // Location is opt-in and is never tracked continuously.
  const [snapPreview, setSnapPreview] = useState(null);
  const [, setSnapFile] = useState(null);
  const [snapLocationEnabled, setSnapLocationEnabled] =
    useState(false);
  const [snapLocationMode, setSnapLocationMode] =
    useState("automatic");
  const [snapLocationName, setSnapLocationName] =
    useState("");
  const [locatingSnap, setLocatingSnap] =
    useState(false);

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
      toast.error("Snap must be smaller than 5MB");
      return;
    }

    try {
      const imageData = await new Promise(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () =>
            resolve(reader.result);

          reader.onerror = reject;

          reader.readAsDataURL(file);
        }
      );

      setSnapFile(file);
      setSnapPreview(imageData);
      setSnapLocationEnabled(false);
      setSnapLocationMode("automatic");
      setSnapLocationName("");
    } catch (error) {
      console.error("Snap preview error:", error);
      toast.error("Unable to read Snap");
    }
  };

  const detectSnapLocation = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      toast.error(
        "Location is not supported by this browser"
      );
      return;
    }

    setLocatingSnap(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } =
            position.coords;

          /*
           * One-time reverse geocoding only.
           * We do NOT start watchPosition() and do NOT
           * store the user's coordinates.
           */
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
              latitude
            )}&longitude=${encodeURIComponent(
              longitude
            )}&localityLanguage=en`
          );

          if (!response.ok) {
            throw new Error(
              "Unable to determine place"
            );
          }

          const data = await response.json();

          const address =
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            data.countryName ||
            "";

          const neighbourhood =
            data.localityInfo?.administrativeArea?.find(
              (item) =>
                item?.description?.toLowerCase?.().includes(
                  "neighbourhood"
                )
            )?.name || "";

          const placeName =
            neighbourhood && address
              ? `${neighbourhood}, ${address}`
              : address;

          if (!placeName) {
            throw new Error(
              "Unable to determine place name"
            );
          }

          setSnapLocationName(placeName);
          setSnapLocationEnabled(true);

          toast.success(
            `Location added: ${placeName}`
          );
        } catch (error) {
          console.error(
            "Snap location lookup error:",
            error
          );

          toast.error(
            "Couldn't determine the place. You can enter it manually."
          );

          setSnapLocationMode("custom");
          setSnapLocationEnabled(true);
        } finally {
          setLocatingSnap(false);
        }
      },
      (error) => {
        console.error(
          "Snap geolocation error:",
          error
        );

        setLocatingSnap(false);
        setSnapLocationMode("custom");
        setSnapLocationEnabled(true);

        toast.error(
          "Location permission was unavailable. You can enter a custom location."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );
  };

  const sendFamilySnap = async () => {
    if (!snapPreview) {
      toast.error("Select a photo first");
      return;
    }

    if (
      snapLocationEnabled &&
      !snapLocationName.trim()
    ) {
      toast.error(
        "Add a location name or turn location off"
      );
      return;
    }

    try {
      setUploadingSnap(true);

      const recipients =
        snapRecipients.length > 0
          ? snapRecipients
          : [];

      await createFamilySnap({
        imageData: snapPreview,
        caption: snapCaption.trim(),
        recipientIds: recipients,
        location: {
          enabled:
            snapLocationEnabled === true,
          name: snapLocationEnabled
            ? snapLocationName.trim()
            : "",
        },
      });

      setSnapCaption("");
      setSnapRecipients([]);
      setSnapPreview(null);
      setSnapFile(null);
      setSnapLocationEnabled(false);
      setSnapLocationMode("automatic");
      setSnapLocationName("");

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
      <section className="mt-4 space-y-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
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
    <section className="mt-4 space-y-3">

      {/* =====================================================
          FAMILY MESSAGE STREAK
      ====================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 text-center shadow-[0_12px_30px_rgba(251,113,133,0.10)]">

        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-rose-100/70 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-rose-500">
              🔥 Family Streak
            </div>

            <div className="rounded-full border border-rose-100 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-rose-400">
              Keep it alive ❤️
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 text-3xl shadow-sm">
              🔥
            </span>

            <span className="text-6xl font-black leading-none text-rose-950">
              {streak.currentStreak}
            </span>

            <span className="text-left text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-rose-400">
              {streak.currentStreak === 1
                ? "Day"
                : "Days"}
              <br />
              Together
            </span>
          </div>

        </div>
      </div>

      {/* =====================================================
          CURRENT FAMILY MESSAGE
      ====================================================== */}
      <div className="overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-[0_14px_32px_rgba(244,114,182,0.08)]">

        <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
              💌
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
                Stay connected
              </p>
              <h2 className="mt-0.5 text-xl font-black tracking-tight text-gray-900">
              Family Message
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
              Streak messages
            </p>
            {messages.length > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-500">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            )}
          </div>

          {messages.length > 0 ? (
          <div className="mt-3 space-y-3">
            {messages.map((item) => {
              const sender = item.sender;
              const senderId = getUserId(sender);

              const isMine =
                senderId.toString() ===
                currentUserId.toString();

              return (
                <div
                  key={item._id}
                  className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-xl shadow-sm">
                    {getRoleEmoji(sender?.role)}
                  </div>

                  <div className={`min-w-0 max-w-[85%] ${isMine ? "text-right" : ""}`}>
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

                    <div className={`mt-2 rounded-2xl p-4 shadow-sm ${isMine ? "rounded-tr-sm bg-rose-100" : "rounded-tl-sm bg-gray-50"}`}>
                      <p className="whitespace-pre-wrap break-words text-base font-medium leading-6 text-gray-900">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-7 text-center">
            <div className="text-4xl">💌</div>

            <p className="mt-3 text-base font-bold text-gray-900">
              No family message yet
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Be the first to send a little love.
            </p>
          </div>
        )}

        {/* SMALL MESSAGE INPUT */}
        <div className="mt-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-orange-50/70 p-3">

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Write something to your family..."
            maxLength={2000}
            rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-white bg-white/90 px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />

          <div className="mt-2">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
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
              className="mt-1 w-full rounded-xl border border-white bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
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
            <div className="mt-3 space-y-2 rounded-2xl border border-white bg-white/50 p-3">
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
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/80 p-3 text-sm transition hover:bg-white"
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
                        className="h-4 w-4 accent-rose-400"
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
            className="mt-3 w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send Family Message 💌"}
          </button>
        </div>
        </div>
      </div>

      {/* =====================================================
          FAMILY SNAPS
      ====================================================== */}
      <div className="rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_14px_32px_rgba(244,114,182,0.07)]">

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-xl">
            📸
          </span>
          <h2 className="text-xl font-black text-gray-900">
            Family Snaps
          </h2>
        </div>

        {/* CREATE SNAP */}
        <div className="mt-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-orange-50/70 p-3">

          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Add a snap
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

          {snapPreview && (
            <div className="mt-4 overflow-hidden rounded-2xl border bg-black">
              <img
                src={snapPreview}
                alt="Snap preview"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          )}

          {snapPreview && (
            <>
              <input
                value={snapCaption}
                onChange={(event) =>
                  setSnapCaption(
                    event.target.value
                  )
                }
                placeholder="Add a caption (optional)"
                maxLength={200}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none focus:border-gray-900"
              />

              {/* LOCATION CHOICE */}
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      📍 Add location?
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSnapLocationEnabled(
                        (current) => {
                          const next = !current;

                          if (!next) {
                            setSnapLocationName("");
                          }

                          return next;
                        }
                      );
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      snapLocationEnabled
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {snapLocationEnabled
                      ? "ON"
                      : "OFF"}
                  </button>
                </div>

                {snapLocationEnabled && (
                  <div className="mt-4">

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSnapLocationMode(
                            "automatic"
                          );
                          setSnapLocationName("");
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          snapLocationMode ===
                          "automatic"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        📍 Current place
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSnapLocationMode(
                            "custom"
                          );
                          setSnapLocationName("");
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          snapLocationMode ===
                          "custom"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        ✏️ Custom
                      </button>
                    </div>

                    {snapLocationMode ===
                      "automatic" && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={
                            detectSnapLocation
                          }
                          disabled={
                            locatingSnap
                          }
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 disabled:opacity-50"
                        >
                          {locatingSnap
                            ? "Finding your place..."
                            : snapLocationName
                              ? `📍 ${snapLocationName}`
                              : "📍 Detect current place"}
                        </button>
                      </div>
                    )}

                    {snapLocationMode ===
                      "custom" && (
                      <input
                        value={
                          snapLocationName
                        }
                        onChange={(event) =>
                          setSnapLocationName(
                            event.target.value
                          )
                        }
                        maxLength={120}
                        placeholder="e.g. Grandma's House ❤️"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-500 outline-none focus:border-gray-900"
                      />
                    )}

                    {snapLocationName && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                        <p className="text-xs font-bold text-gray-800">
                          📍 {snapLocationName}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setSnapLocationEnabled(
                              false
                            );
                            setSnapLocationName(
                              ""
                            );
                          }}
                          className="text-[11px] font-bold text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RECIPIENTS */}
              {otherMembers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-700">
                    Snap recipients
                  </p>

                  <div className="mt-2 space-y-1">
                    {otherMembers.map(
                      (member) => {
                        const id =
                          getUserId(member);

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
                      }
                    )}
                  </div>

                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSnapPreview(null);
                    setSnapFile(null);
                    setSnapCaption("");
                    setSnapRecipients([]);
                    setSnapLocationEnabled(false);
                    setSnapLocationMode("automatic");
                    setSnapLocationName("");

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={uploadingSnap}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={sendFamilySnap}
                  disabled={
                    uploadingSnap ||
                    locatingSnap
                  }
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {uploadingSnap
                    ? "Sharing..."
                    : "Share Snap 📸"}
                </button>
              </div>
            </>
          )}

          {uploadingSnap && (
            <p className="mt-3 text-xs font-bold text-blue-600">
              Uploading Snap...
            </p>
          )}
        </div>

        {/* =====================================================
            MY SNAP
        ====================================================== */}
        {latestMySnap && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-gray-900">
                  {getRoleEmoji(
                    latestMySnap.sender?.role
                  )}{" "}
                  
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                  Expires{" "}
                  {new Date(
                    latestMySnap.expiresAt
                  ).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
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
                className="text-xs font-bold text-red-500"
              >
                Delete
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black shadow-sm">
              <img
                src={latestMySnap.imageData}
                alt="My family snap"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            {latestMySnap.location?.enabled &&
              latestMySnap.location?.name && (
                <p className="mt-2 text-xs font-bold text-gray-600">
                  📍 {latestMySnap.location.name}
                </p>
              )}

            {latestMySnap.caption && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                {latestMySnap.caption}
              </p>
            )}
          </div>
        )}

        {/* =====================================================
            OTHER FAMILY SNAPS
        ====================================================== */}
        <div className="mt-7 space-y-7">
          {latestSnapBySender.map((snap) => (
            <div key={snap._id}>
              <div className="mb-3">
                <p className="text-base font-black text-gray-900">
                  {getRoleEmoji(
                    snap.sender?.role
                  )}{" "}
                  {snap.sender?.fullName ||
                    "Family Member"}
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                  Expires{" "}
                  {new Date(
                    snap.expiresAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black shadow-sm">
                <img
                  src={snap.imageData}
                  alt={`${
                    snap.sender?.fullName ||
                    "Family"
                  } snap`}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>

              {snap.location?.enabled &&
                snap.location?.name && (
                  <p className="mt-2 text-xs font-bold text-gray-600">
                    📍 {snap.location.name}
                  </p>
                )}

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
