"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getProviderBookings,
  updateBookingStatus,
} from "@/services/providerBookingService";

const FILTERS = [
  "all",
  "pending",
  "accepted",
  "completed",
  "rejected",
  "cancelled",
];

const STATUS_CLASSES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-gray-200 bg-gray-100 text-gray-600",
};

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProviderBookings();

      setBookings(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("Provider bookings error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const changeStatus = async (bookingId, status) => {
    if (updating) return;

    if (
      status === "rejected" &&
      !window.confirm("Reject this care request?")
    ) {
      return;
    }

    try {
      setUpdating(bookingId);
      setError("");

      const response = await updateBookingStatus(
        bookingId,
        status
      );

      const updated = response?.data;

      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId
            ? updated || { ...booking, status }
            : booking
        )
      );
    } catch (err) {
      console.error("Status update error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update booking."
      );
    } finally {
      setUpdating("");
    }
  };

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;

    return bookings.filter(
      (booking) => booking.status === filter
    );
  }, [bookings, filter]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getChildName = (booking) =>
    booking.child?.fullName ||
    booking.child?.name ||
    "Child";

  const getParentName = (booking) =>
    booking.parent?.user?.fullName ||
    booking.parent?.fullName ||
    "Parent";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">

        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/provider/dashboard"
              className="text-sm font-medium text-blue-600"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Booking History
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage all your care requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBookings}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                filter === item
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">📋</div>

            <h2 className="mt-3 font-semibold text-gray-900">
              No bookings found
            </h2>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filteredBookings.map((booking) => {
              const status = booking.status || "pending";

              return (
                <article
                  key={booking._id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">
                          {booking.service}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            STATUS_CLASSES[status] ||
                            STATUS_CLASSES.pending
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p>
                          <strong className="text-gray-900">
                            Parent:
                          </strong>{" "}
                          {getParentName(booking)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Child:
                          </strong>{" "}
                          {getChildName(booking)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Date:
                          </strong>{" "}
                          {formatDate(booking.date)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Time:
                          </strong>{" "}
                          {booking.time || "Unavailable"}
                        </p>

                        {booking.notes && (
                          <p className="break-words">
                            <strong className="text-gray-900">
                              Notes:
                            </strong>{" "}
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                booking._id,
                                "accepted"
                              )
                            }
                            disabled={
                              updating === booking._id
                            }
                            className="min-h-11 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                booking._id,
                                "rejected"
                              )
                            }
                            disabled={
                              updating === booking._id
                            }
                            className="min-h-11 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {status === "accepted" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              booking._id,
                              "completed"
                            )
                          }
                          disabled={
                            updating === booking._id
                          }
                          className="min-h-11 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
